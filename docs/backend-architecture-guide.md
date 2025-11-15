# 後端架構完整指南（給前端工程師）

> 專案：Parklane Gifts Swap 2025
> 作者：Claude + Vann
> 最後更新：2025-11-15

---

## 目錄

1. [Prisma 是什麼？](#1-prisma-是什麼)
2. [schema.prisma 詳解](#2-schemaprisma-詳解)
3. [資料庫結構圖](#3-資料庫結構圖-er-diagram)
4. [API Routes 設計](#4-api-routes-設計restful-分析)
5. [完整資料流程](#5-完整資料流程end-to-end)
6. [資料庫索引優化](#6-資料庫索引index優化)
7. [常見問題 Q&A](#7-常見問題-qa)
8. [本地開發工作流程](#8-本地開發工作流程)
9. [總結](#9-總結你需要知道的關鍵點)

---

## 1️⃣ Prisma 是什麼？

### 用前端術語類比：

**Prisma = TypeScript 版的 SQL 語言**

```typescript
// 傳統 SQL（像寫 vanilla JavaScript）
const result = await db.query('SELECT * FROM users WHERE id = ?', [userId])

// Prisma（像寫 TypeScript）
const result = await prisma.user.findUnique({
  where: { id: userId }
})
// ✅ 有型別提示、自動完成、編譯時錯誤檢查
```

**Prisma 的三大組成部分：**

1. **Prisma Schema**（`schema.prisma`）
   → 就像你寫的 **TypeScript interface**，定義資料結構

2. **Prisma Client**（`import { prisma } from '~/lib/prisma'`）
   → 就像 **axios**，用來操作資料庫的 API 客戶端

3. **Prisma Migrate**（資料庫遷移工具）
   → 就像 **Git**，追蹤資料庫結構的版本變化

---

## 2️⃣ schema.prisma 詳解

### 📄 這個文件的作用

**類比：如果 React 有 `.tsx`，那資料庫就有 `.prisma`**

```prisma
// prisma/schema.prisma

// 🔧 設定區：告訴 Prisma 要連接哪種資料庫
datasource db {
  provider = "postgresql"          // 用 PostgreSQL（也可以是 MySQL, SQLite）
  url      = env("DATABASE_URL")   // 資料庫連線網址（從 .env 讀取）
}

// 🎨 生成器：自動生成 TypeScript 代碼
generator client {
  provider = "prisma-client-js"    // 生成 JavaScript/TypeScript 客戶端
}
```

---

### 📦 資料模型（Models）

#### **Grid 模型（格子表）**

```prisma
model Grid {
  id                   Int          @id @default(autoincrement())
  gridNumber           Int          @unique  // 1-30（唯一值）
  currentGiftType      String?      // 'A' | 'B' | 'C' | 'default'
  currentParticipantId Int?
  status               String       @default("available")
  updatedAt            DateTime     @updatedAt

  submissions          Submission[] // 一對多關係

  @@index([status])                 // 加速查詢
}
```

**用前端術語理解：**

```typescript
// 類比成 TypeScript interface
interface Grid {
  id: number                    // 主鍵（Primary Key）
  gridNumber: number            // 格子編號（1-30）
  currentGiftType: string | null // 當前禮物類型
  status: 'available' | 'locked' // 狀態
  updatedAt: Date

  // 關聯
  submissions: Submission[]      // 這個格子的所有參加記錄
}
```

**特殊符號說明：**
- `@id` → 主鍵（像 React 的 `key`）
- `@unique` → 唯一值（不能重複）
- `@default(...)` → 預設值
- `@updatedAt` → 自動更新時間
- `?` → 可選（nullable）
- `@@index` → 資料庫索引（加速查詢）

---

#### **Submission 模型（參加者記錄）**

```prisma
model Submission {
  id                Int       @id @default(autoincrement())
  participantNumber Int       // 全局編號（1, 2, 3...）
  isInitialGift     Boolean   @default(false)
  realParticipantNo Int?      // 真實參加者編號
  giftType          String    // 'A' | 'B' | 'C'
  message           String    @default("")
  name              String    @default("")
  lineId            String?
  instagram         String?
  assignedGridId    Int       // 外鍵（Foreign Key）
  status            String    @default("pending")
  createdAt         DateTime  @default(now())
  completedAt       DateTime?
  expiresAt         DateTime

  grid              Grid      @relation(fields: [assignedGridId], references: [id])
}
```

**關聯關係：**

```typescript
// Submission belongs to Grid（多對一）
submission.grid          // 取得所屬的格子
grid.submissions         // 取得格子的所有參加記錄

// 在 SQL 中是這樣：
// SELECT * FROM Submission WHERE assignedGridId = grid.id
```

---

## 3️⃣ 資料庫結構圖（ER Diagram）

```
┌─────────────────┐          ┌──────────────────┐
│      Grid       │ 1     * │   Submission     │
│─────────────────│◄────────│──────────────────│
│ id (PK)         │          │ id (PK)          │
│ gridNumber      │          │ participantNumber│
│ currentGiftType │          │ giftType         │
│ status          │          │ name             │
│                 │          │ assignedGridId(FK)│
└─────────────────┘          └──────────────────┘

PK = Primary Key（主鍵）
FK = Foreign Key（外鍵）
1:* = 一對多關係
```

**關鍵設計：**

1. **30 個固定格子**：遊戲開始前初始化（`/api/grids/initialize`）
2. **參加記錄無限**：每次玩家參加都新增一筆 Submission
3. **格子追蹤當前狀態**：`currentGiftType` 記錄最後一個放入的禮物類型

---

## 4️⃣ API Routes 設計（RESTful 分析）

### 📁 目前的 API 結構

```
src/app/api/
├── grids/
│   ├── route.ts                    GET /api/grids
│   ├── initialize/route.ts         POST /api/grids/initialize
│   └── preview/route.ts            GET /api/grids/preview
├── submissions/
│   ├── route.ts                    POST /api/submissions
│   ├── next-number/route.ts        GET /api/submissions/next-number
│   └── [id]/complete/route.ts      POST /api/submissions/:id/complete
└── auth/
    └── validate/route.ts           POST /api/auth/validate
```

---

### ✅ RESTful 評分

| API | Method | RESTful? | 說明 |
|-----|--------|----------|------|
| `/api/grids` | GET | ✅ 符合 | 取得資源列表 |
| `/api/grids/initialize` | POST | ⚠️ 部分符合 | 應該是 PUT `/api/grids`（冪等操作） |
| `/api/grids/preview` | GET | ✅ 符合 | 查詢參數過濾 |
| `/api/submissions` | POST | ✅ 符合 | 創建資源 |
| `/api/submissions/next-number` | GET | ⚠️ 部分符合 | 這是 RPC 風格，不是資源操作 |
| `/api/submissions/:id/complete` | POST | ❌ 不符合 | 應該是 PATCH `/api/submissions/:id` |

---

### 🔍 RESTful 改進建議

**現在：**
```http
POST /api/submissions/:id/complete
```

**更 RESTful：**
```http
PATCH /api/submissions/:id
Body: { status: "completed" }
```

**現在：**
```http
GET /api/submissions/next-number
```

**更 RESTful（但不一定更好）：**
```http
GET /api/submissions/stats
Response: { nextNumber: 123, total: 122 }
```

**結論：**
- ✅ **基本符合 RESTful**（資源導向）
- ⚠️ **部分 API 偏向 RPC**（動作導向），但這在實務中很常見
- 💡 **建議**：維持現狀即可，除非團隊有嚴格的 RESTful 規範

---

## 5️⃣ 完整資料流程（End-to-End）

### 🎯 **使用者流程：從進入到完成**

```
┌────────────┐
│ 1. Welcome │ GET /api/submissions/next-number
│    頁面     │ → 顯示預估編號 #00123
└──────┬─────┘
       │
       ▼
┌────────────┐
│ 2. Test    │ 本地計算（無 API 呼叫）
│    測驗     │ → 得到 giftType: 'A'
└──────┬─────┘
       │
       ▼
┌────────────┐
│ 3. Message │ 本地儲存到 gameState
│    留言     │ → message: "聖誕快樂！"
└──────┬─────┘
       │
       ▼
┌────────────┐
│ 4. Contact │ 本地儲存到 gameState
│    聯絡     │ → name, lineId, instagram
└──────┬─────┘
       │
       ▼
┌────────────┐
│ 5. Draw    │ GET /api/grids/preview?giftType=A&preferSameType=true
│    抽選     │ → 返回符合偏好的格子列表
└──────┬─────┘ → 前端隨機選一個格子
       │      → 用 flushSync 更新 gameState.drawResult
       │      → 列印小卡
       │
       ▼
┌────────────┐
│ 6. Result  │ 工作人員點「完成交換」
│    結果     │ POST /api/submissions
└────────────┘ → 寫入資料庫，完成整個流程
```

---

### 🔄 **後端關鍵 API 詳解**

#### **API 1: GET /api/grids/preview**

**用途**：預覽可抽選的格子（不寫入資料庫）

**流程：**
```typescript
// 1. 接收參數
const giftType = 'A'
const preferSameType = true

// 2. 建構查詢條件
let whereCondition = { status: 'available' }
if (preferSameType === true) {
  whereCondition.currentGiftType = giftType  // 只找同類型
}

// 3. 查詢資料庫
let grids = await prisma.grid.findMany({ where: whereCondition })

// 4. 降級策略（沒有符合偏好的格子）
if (grids.length === 0) {
  grids = await prisma.grid.findMany({ where: { status: 'available' } })
}

// 5. 取得每個格子的上一個參加者資訊
const gridsWithPrev = await Promise.all(
  grids.map(async (grid) => {
    const prev = await prisma.submission.findFirst({
      where: { assignedGridId: grid.id, status: 'completed' },
      orderBy: { completedAt: 'desc' }
    })
    return { ...grid, previousSubmission: prev }
  })
)

// 6. 返回
return { availableGrids: gridsWithPrev, matchedPreference }
```

**類比前端：**
```typescript
// 就像你在 React 中做的：
const filteredItems = items.filter(item => item.category === selectedCategory)
if (filteredItems.length === 0) {
  filteredItems = items  // 降級到全部
}
```

---

#### **API 2: POST /api/submissions**

**用途**：確認完成交換，寫入資料庫

**流程：**
```typescript
// 1. 驗證格子是否可用
const grid = await prisma.grid.findUnique({ where: { id: assignedGridId } })
if (grid.status !== 'available') {
  return { error: '格子已被佔用', retryable: true }
}

// 2. 使用事務（Transaction）確保原子性
const submission = await prisma.$transaction(async (tx) => {
  // 2.1 鎖定格子（樂觀鎖）
  const locked = await tx.grid.updateMany({
    where: { id: assignedGridId, status: 'available' },
    data: { status: 'locked' }
  })

  if (locked.count === 0) {
    throw new Error('格子已被佔用')  // Race condition
  }

  // 2.2 創建參加記錄
  return tx.submission.create({
    data: {
      participantNumber: nextNumber,
      giftType,
      message,
      name,
      assignedGridId,
      status: 'pending',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)  // 5 分鐘後過期
    }
  })
})

// 3. 返回結果
return { success: true, submission }
```

**為什麼用 Transaction？**

```typescript
// ❌ 沒有 transaction（可能出現 race condition）
const grid = await prisma.grid.update({ ... })  // 第 1 步
const submission = await prisma.submission.create({ ... })  // 第 2 步
// 問題：兩個請求同時執行，可能兩個都通過第 1 步檢查

// ✅ 有 transaction（原子性操作）
await prisma.$transaction(async (tx) => {
  await tx.grid.update({ ... })        // 第 1 步
  await tx.submission.create({ ... })  // 第 2 步
})
// 保證：要麼全部成功，要麼全部失敗
```

**類比前端：**
```typescript
// 就像 useState 的批次更新
setState({ step1: true })
setState({ step2: true })
// React 會合併這兩次更新，確保 UI 一致性
```

---

## 6️⃣ 資料庫索引（Index）優化

### 什麼是索引？

**類比：書的目錄**

```typescript
// ❌ 沒有索引（全表掃描）
// 就像從第 1 頁翻到最後一頁找"Prisma"這個詞
SELECT * FROM Grid WHERE status = 'available'  // 慢🐢

// ✅ 有索引
// 就像直接翻到目錄，看到"Prisma"在第 42 頁
@@index([status])  // 快🚀
```

### 這個專案的索引策略

```prisma
model Grid {
  @@index([status])                    // 常用查詢：找可用格子
  @@index([currentGiftType, status])   // 組合查詢：找特定類型的可用格子
}

model Submission {
  @@index([assignedGridId])               // 找特定格子的記錄
  @@index([status])                       // 找特定狀態的記錄
  @@index([expiresAt])                    // 清理過期記錄
  @@index([isInitialGift])                // 區分預設禮物和真實參加者
  @@index([realParticipantNo])            // 查詢真實參加者編號
  @@index([participantNumber])            // 查詢全局參加者編號
  @@index([assignedGridId, status, completedAt])  // 優化查詢上一個參加者
  @@index([isInitialGift, realParticipantNo])     // 優化查詢下一個編號
}
```

### 索引優化說明

**1. 組合索引：`[assignedGridId, status, completedAt]`**

**用於查詢**：取得特定格子的最新完成記錄
```typescript
// /api/grids/preview
const prev = await prisma.submission.findFirst({
  where: {
    assignedGridId: grid.id,  // 條件 1
    status: 'completed'        // 條件 2
  },
  orderBy: { completedAt: 'desc' }  // 排序
})
```

**2. 組合索引：`[isInitialGift, realParticipantNo]`**

**用於查詢**：取得下一個參加者編號
```typescript
// /api/submissions/next-number
const last = await prisma.submission.findFirst({
  where: { isInitialGift: false },      // 條件
  orderBy: { realParticipantNo: 'desc' }  // 排序
})
```

**3. 單一索引：`[participantNumber]`**

**用於查詢**：取得最後一個全局編號
```typescript
// /api/submissions
const last = await prisma.submission.findFirst({
  orderBy: { participantNumber: 'desc' }
})
```

---

## 7️⃣ 常見問題 Q&A

### Q1: 為什麼用 Prisma 而不是直接寫 SQL？

**A:**

| 傳統 SQL | Prisma |
|---------|--------|
| `SELECT * FROM users WHERE id = ?` | `prisma.user.findUnique({ where: { id } })` |
| ❌ 沒有型別檢查 | ✅ TypeScript 自動完成 |
| ❌ SQL 注入風險 | ✅ 自動防注入 |
| ❌ 手動處理關聯 | ✅ 自動載入關聯 |

---

### Q2: `prisma.$transaction` 什麼時候用？

**A:** 當你需要**多個操作要麼全成功，要麼全失敗**時使用

```typescript
// 範例：轉帳（A 帳戶 -100，B 帳戶 +100）
await prisma.$transaction([
  prisma.account.update({ where: { id: 'A' }, data: { balance: { decrement: 100 } } }),
  prisma.account.update({ where: { id: 'B' }, data: { balance: { increment: 100 } } })
])
// 如果中間任何一步失敗，所有變更都會回滾
```

---

### Q3: `@@index` 什麼時候加？

**A:**

✅ **應該加索引：**
- WHERE 條件常用的欄位（`status`, `giftType`）
- 外鍵欄位（`assignedGridId`）
- ORDER BY 的欄位（`completedAt`）

❌ **不該加索引：**
- 很少查詢的欄位
- 資料重複率高的欄位（`isInitialGift` 只有 true/false）

**經驗法則：** 如果查詢很慢，先用 `EXPLAIN` 分析，再決定是否加索引

---

### Q4: 什麼是 Race Condition？為什麼需要樂觀鎖？

**A:**

**Race Condition（競態條件）：**
```typescript
// 情境：兩個用戶同時抽到同一個格子

// 用戶 A（時間 T1）
const grid = await prisma.grid.findUnique({ where: { id: 1 } })
// grid.status = 'available' ✅

// 用戶 B（時間 T1.1）
const grid = await prisma.grid.findUnique({ where: { id: 1 } })
// grid.status = 'available' ✅（還沒被 A 鎖定）

// 用戶 A（時間 T2）
await prisma.grid.update({ where: { id: 1 }, data: { status: 'locked' } })

// 用戶 B（時間 T2.1）
await prisma.grid.update({ where: { id: 1 }, data: { status: 'locked' } })

// ❌ 結果：兩個用戶都成功，格子被重複分配！
```

**解決方案：樂觀鎖（Optimistic Locking）**
```typescript
// 使用 updateMany + 條件檢查
const locked = await prisma.grid.updateMany({
  where: {
    id: 1,
    status: 'available'  // 只有狀態是 available 才更新
  },
  data: { status: 'locked' }
})

if (locked.count === 0) {
  throw new Error('格子已被佔用')  // 其他人搶先了
}
```

---

## 8️⃣ 本地開發工作流程

### 🛠️ 常用 Prisma 指令

```bash
# 1. 初始化資料庫（根據 schema.prisma 創建資料表）
npx prisma db push

# 2. 查看資料庫（開啟 GUI）
npx prisma studio

# 3. 生成 TypeScript 類型（每次改 schema 後要執行）
npx prisma generate

# 4. 創建遷移（正式環境）
npx prisma migrate dev --name add_user_table

# 5. 查看資料庫結構
npx prisma db pull
```

### 📋 開發流程

1. **修改 schema.prisma**
   ```prisma
   model User {
     id    Int    @id @default(autoincrement())
     email String @unique
   }
   ```

2. **同步資料庫**
   ```bash
   npx prisma db push
   ```

3. **生成類型**（自動執行，不需要手動）
   ```bash
   npx prisma generate
   ```

4. **在代碼中使用**
   ```typescript
   const user = await prisma.user.create({
     data: { email: 'test@example.com' }
   })
   // TypeScript 會自動提示 user.id, user.email
   ```

---

## 9️⃣ 總結：你需要知道的關鍵點

1. **Prisma = TypeScript 版的 SQL**
   不用寫 SQL，用物件操作資料庫

2. **schema.prisma = 資料庫的 TypeScript interface**
   定義資料結構、關聯、索引

3. **Transaction = 多個操作的原子性保證**
   避免 race condition

4. **Index = 查詢加速器**
   常查詢的欄位要加索引

5. **這個專案的 API 基本符合 RESTful**
   資源導向，語義清晰

6. **樂觀鎖 = 防止 Race Condition**
   使用 `updateMany` + 條件檢查

---

## 📚 延伸閱讀

- [Prisma 官方文檔](https://www.prisma.io/docs)
- [PostgreSQL 索引優化指南](https://www.postgresql.org/docs/current/indexes.html)
- [RESTful API 設計最佳實踐](https://restfulapi.net/)
- [資料庫 Transaction 深入理解](https://www.postgresql.org/docs/current/tutorial-transactions.html)

---

**有任何問題歡迎隨時詢問！** 🚀
