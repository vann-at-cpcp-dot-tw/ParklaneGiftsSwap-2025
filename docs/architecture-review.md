# 禮物交換遊戲 - 系統架構審查與建議

## 目錄
- [核心判斷](#核心判斷)
- [關鍵洞察：數據結構設計](#關鍵洞察數據結構設計)
- [流程簡化方案](#流程簡化方案)
- [併發處理機制](#併發處理機制)
- [技術選型建議](#技術選型建議)
- [健壯性評估](#健壯性評估)
- [推薦系統架構](#推薦系統架構)
- [實作步驟建議](#實作步驟建議)

---

## 核心判斷

✅ **設計方向正確** - 解決真實問題，而非臆想的威脅
⚠️ **但有過度複雜的部分** - 某些設計可以大幅簡化

---

## 關鍵洞察：數據結構設計

> "Bad programmers worry about the code. Good programmers worry about data structures." - Linus Torvalds

### 核心數據結構

```typescript
// 核心數據：30 個格子的「當前狀態」
Grids (格子表)
├─ id: 1-30 (固定 30 格)
├─ current_gift_type: 'A' | 'B' | 'C' | 'default'
├─ current_participant_id: number (當前格子內禮物的擁有者)
└─ status: 'available' | 'locked' (併發鎖)

// 歷史記錄：每次交換的完整 log
Submissions (提交表 - 這才是完整記錄)
├─ id: 自增 (流水號)
├─ participant_number: 自增 (第幾號參加者，顯示用)
├─ gift_type: 'A' | 'B' | 'C' (心理測驗結果)
├─ message: string (20 字留言)
├─ answers: json (6 題心理測驗的答案)
├─ assigned_grid_id: 1-30 (抽到哪一格)
├─ status: 'pending' | 'completed' (是否完成實體交換)
├─ created_at: timestamp
└─ completed_at: timestamp
```

### 為什麼這樣設計？

- `Grids` 只需要 30 筆固定資料，追蹤「當前」狀態
- `Submissions` 記錄所有歷史，可以重建任何時間點的格子狀態
- **不需要額外的 GridLog 表**，`Submissions` 本身就是完整 log

---

## 流程簡化方案

### 1. 列印機整合（消除輪詢複雜度）

#### ❌ 原方案（過度複雜）
```
電腦輪詢 DB → 發現列印任務 → 發送到列印機
```

#### ✅ 簡化方案（零輪詢）
```
前端 (iPad) ──抽獎─→ API ──返回結果─→ 前端
                                      ↓
                              前端調用瀏覽器列印
                                      ↓
                              透過 AirPrint 或 USB
                                      ↓
                              熱感應列印機
```

**實作方式：**
```typescript
// 前端收到 API 結果後
const printContent = {
  gridNumber: result.assignedGridId,
  previousParticipant: result.previousSubmission
}

// 觸發瀏覽器列印對話框
window.print()
```

**如果列印機不支援 AirPrint：**
- 方案 A：購買支援 AirPrint 的版本（Epson TM-T82III 有支援的型號）
- 方案 B：前端顯示 QR code，工作人員掃描後在連接列印機的電腦上列印

---

### 2. 兩階段提交 + 超時機制

#### 問題
使用者抽獎後走人，格子被鎖定但沒有完成交換

#### 解決方案：超時自動解鎖

```typescript
// API: POST /api/draw
{
  status: 'pending',  // 先鎖定格子
  assigned_grid_id: 15,
  expires_at: now + 5 minutes  // 5 分鐘後自動解鎖
}

// API: POST /api/complete
{
  submission_id: 123
}
// 完成交換，寫入 completed_at

// 背景任務：每分鐘清理過期的 pending 狀態
// 將格子 status 從 'locked' 改回 'available'
```

**優點：**
- ✅ 使用者走人？5 分鐘後自動釋放格子
- ✅ 工作人員按「完成」？正常寫入
- ✅ 資料一致性有保證

---

### 3. 重印按鈕（必須有）

```typescript
// 前端：顯示當前 submission 的「列印」按鈕
<button onClick={() => window.print()}>
  重新列印
</button>

// 配合 CSS 控制列印內容
@media print {
  .no-print { display: none; }
  .print-only { display: block; }
}
```

**理由：**
- ✅ 缺紙不會影響遊戲進行
- ✅ 實作簡單
- ✅ 工作人員友善

---

## 併發處理機制

### 問題
多台 iPad 同時抽獎可能抽到同一個格子

### 解決方案：資料庫層面的樂觀鎖

```sql
-- PostgreSQL 範例
UPDATE grids
SET status = 'locked', current_participant_id = 123
WHERE id = 15
  AND status = 'available'  -- 只有 available 才能鎖定
RETURNING *;

-- 如果返回 0 rows，表示被其他人搶先了，重新抽一個格子
```

### 抽獎流程（含併發處理）

```
1. 前端提交表單 → API 計算禮物類型
2. API 根據類型篩選可用格子 (status = 'available')
3. 隨機選一個，嘗試 UPDATE 加鎖
4. 如果失敗（被搶），重新選另一個
5. 如果所有該類型都被鎖，降級為隨機抽取
```

**零額外複雜度，資料庫原生支援**

---

## 技術選型建議

### 後端方案比較

| 方案 | 優點 | 缺點 | 判斷 |
|------|------|------|------|
| **無頭 WordPress** | 你熟悉 | 為了 30 格資料用 WordPress？過度工程 | ❌ 不推薦 |
| **Google Sheets** | 快速原型 | 併發控制差、查詢慢、不專業 | ❌ 不適合 |
| **Next.js + DB** | 統一技術棧、型別安全 | 需要學 ORM（但很簡單） | ✅ **最佳選擇** |

### 推薦技術棧

```
前端框架：Next.js 14+ (App Router)
ORM 工具：Prisma (零 SQL，自動生成 TypeScript 型別)
資料庫：Supabase (免費 PostgreSQL + 即時資料庫 + 自動備份)
部署平台：Vercel (前端 + API，零配置)
```

### Prisma Schema 範例

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Grid {
  id                   Int         @id @default(autoincrement())
  gridNumber           Int         @unique // 1-30
  currentGiftType      String?     // 'A' | 'B' | 'C' | 'default'
  currentParticipantId Int?
  status               String      @default("available") // 'available' | 'locked'
  updatedAt            DateTime    @updatedAt

  submissions          Submission[]
}

model Submission {
  id                Int       @id @default(autoincrement())
  participantNumber Int       // 第幾號參加者（顯示用）
  giftType          String    // 'A' | 'B' | 'C'
  message           String    // 20 字留言
  answers           Json      // 6 題心理測驗答案
  assignedGridId    Int       // 抽到哪一格
  status            String    @default("pending") // 'pending' | 'completed'
  createdAt         DateTime  @default(now())
  completedAt       DateTime?
  expiresAt         DateTime  // 超時時間

  grid              Grid      @relation(fields: [assignedGridId], references: [id])
}
```

### API 範例（零 SQL）

```typescript
// app/api/draw/route.ts
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const { giftType, message, answers } = await request.json()

  // 1. 找可用格子（優先同類型）
  let availableGrids = await prisma.grid.findMany({
    where: {
      status: 'available',
      currentGiftType: giftType
    }
  })

  // 2. 如果同類型沒有，降級為隨機
  if (availableGrids.length === 0) {
    availableGrids = await prisma.grid.findMany({
      where: { status: 'available' }
    })
  }

  if (availableGrids.length === 0) {
    return Response.json({ error: '所有格子都被佔用' }, { status: 503 })
  }

  // 3. 隨機選一個
  const selectedGrid = availableGrids[
    Math.floor(Math.random() * availableGrids.length)
  ]

  // 4. 取得「上一個」參加者的資料（用於列印）
  const previousSubmission = await prisma.submission.findFirst({
    where: {
      assignedGridId: selectedGrid.id,
      status: 'completed'
    },
    orderBy: { completedAt: 'desc' }
  })

  // 5. 鎖定並創建提交記錄（事務保證原子性）
  const submission = await prisma.$transaction(async (tx) => {
    // 嘗試鎖定格子
    const lockedGrid = await tx.grid.updateMany({
      where: {
        id: selectedGrid.id,
        status: 'available'  // 樂觀鎖：只有 available 才能鎖
      },
      data: { status: 'locked' }
    })

    if (lockedGrid.count === 0) {
      throw new Error('格子已被佔用，請重試')
    }

    // 創建提交記錄
    return tx.submission.create({
      data: {
        giftType,
        message,
        answers,
        assignedGridId: selectedGrid.id,
        status: 'pending',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 分鐘
        participantNumber: await getNextParticipantNumber(tx)
      }
    })
  })

  return Response.json({
    submission,
    previousSubmission  // 前端用於列印
  })
}

async function getNextParticipantNumber(tx) {
  const lastSubmission = await tx.submission.findFirst({
    orderBy: { participantNumber: 'desc' }
  })
  return (lastSubmission?.participantNumber || 0) + 1
}
```

---

## 健壯性評估

### ✅ 原設計做對的部分
1. ✅ 前端無路由設計（安全考量）
2. ✅ 兩階段提交（列印 → 確認完成）
3. ✅ 考慮併發問題
4. ✅ 考慮降級策略（同類型抽完改隨機）

### ⚠️ 需要加強的部分
1. ⚠️ 超時機制（pending 狀態的過期處理）
2. ⚠️ 樂觀鎖實作（避免併發衝突）
3. ⚠️ 列印機整合簡化（不需要輪詢）

### 🔴 過度擔心的部分
1. 🔴 「缺紙會影響遊戲」→ **不會！重印就好**
2. 🔴 「需要電腦輪詢」→ **不需要！前端直接列印**
3. 🔴 「需要多表關聯」→ **不需要！兩張表足夠**

---

## 推薦系統架構

```
┌─────────────────┐
│  iPad (前端)     │
│  Next.js        │
│  - Guard 驗證    │
│  - 表單填寫      │
│  - 列印觸發      │
└────────┬────────┘
         │ HTTPS
         ↓
┌─────────────────────────┐
│  Next.js API Routes     │
│  - /api/validate        │
│  - /api/draw           │
│  - /api/complete       │
│  - /api/reprint        │
│  (Prisma ORM)          │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────┐
│  Supabase               │
│  (PostgreSQL)           │
│  - Grids (30 筆)        │
│  - Submissions (log)    │
└─────────────────────────┘

列印流程：
iPad → window.print() → AirPrint → 熱感應列印機
```

### 部署建議

- **前端 + API**：Vercel（零配置，自動 HTTPS，免費額度足夠）
- **資料庫**：Supabase（免費 500MB，自動備份）
- **列印機**：透過 iPad 的 AirPrint 直接連接

---

## 實作步驟建議

### 階段 1：資料庫設置
1. 建立 Supabase 專案
2. 安裝 Prisma：`npm install prisma @prisma/client`
3. 初始化 Prisma：`npx prisma init`
4. 設計 Schema（見上方範例）
5. 推送到資料庫：`npx prisma db push`
6. 生成 TypeScript 型別：`npx prisma generate`

### 階段 2：API 開發
1. 實作 `/api/draw`（抽獎 + 併發控制）
2. 實作 `/api/complete`（完成交換）
3. 實作 `/api/reprint`（重新列印）
4. 實作背景任務（清理過期 pending 狀態）

### 階段 3：前端整合
1. 表單頁面（心理測驗 + 留言）
2. 抽獎結果頁面（含列印按鈕）
3. 列印版面設計（CSS `@media print`）
4. 工作人員控制頁面（完成交換、重印）

### 階段 4：測試
1. 單台 iPad 流程測試
2. 多台 iPad 併發測試
3. 超時機制測試
4. 列印功能測試

---

## 總結

### 核心原則
1. **數據結構優先** - 好的數據結構讓代碼自然簡單
2. **消除特殊情況** - 用通用邏輯取代 if/else 分支
3. **實用主義** - 解決真實問題，不要過度設計
4. **向後兼容** - 保證數據一致性，可以重建任何時間點的狀態

### 最大的簡化
- ❌ 不需要電腦輪詢列印機
- ❌ 不需要複雜的多表關聯
- ❌ 不需要手寫 SQL
- ✅ 兩張表 + Prisma ORM = 搞定

### 風險控制
- ✅ 超時自動解鎖（避免死鎖）
- ✅ 樂觀鎖（避免併發衝突）
- ✅ 事務保證（資料一致性）
- ✅ 降級策略（保證遊戲流暢）

---

**下一步：選擇實作順序**
1. 資料庫設置 + Prisma 整合
2. 抽獎 API（含併發控制）
3. 列印功能（含重印按鈕）

依你的優先順序，我可以提供具體的實作代碼。
