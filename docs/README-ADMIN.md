# 管理介面使用指南

## 🎯 快速開始

### 1. 啟動開發伺服器
```bash
npm run dev
```

### 2. 訪問管理頁面
```
http://localhost:3000/admin
```

> 注意：由於專案使用 i18n middleware，訪問 `/admin` 會自動 rewrite 到 `/zh/admin` 處理

---

## 📋 管理頁面功能

### 1. 隨機生成測試資料 🎲
- **用途**: 快速生成 30 個初始禮物進行測試
- **操作**: 點擊「隨機生成測試資料」按鈕
- **生成內容**:
  - 類型：隨機 A/B/C
  - 姓名：測試用戶1-30
  - 留言：隨機句子
  - LINE ID: line_user_1-30
  - Instagram: ig_user_1-30

**適用場景**: 開發測試、功能驗證

---

### 2. 手動輸入初始資料 📝
- **用途**: 工作人員手動填寫每個格子的初始禮物資訊
- **操作**:
  1. 點擊「手動輸入初始資料」展開表單
  2. 填寫 30 個禮物的資訊
  3. 點擊「確認送出並初始化」

**表單欄位**:
- 類型 * (必填): A / B / C
- 姓名 * (必填): 參加者姓名
- 留言 (選填): 最多 20 字
- LINE ID (選填): LINE 帳號
- Instagram (選填): IG 帳號

**適用場景**: 正式上線前的初始化

---

### 3. 清空所有資料 🗑️
- **用途**: 重置遊戲，刪除所有格子和參加者記錄
- **操作**: 點擊「清空所有資料」按鈕（會有二次確認）
- **警告**: ⚠️ 此操作無法復原！

**適用場景**:
- 測試後重置
- 活動結束後清理
- 遊戲重新開始

---

## 🔄 完整遊戲流程

### 準備階段（工作人員）

1. **清空舊資料**（如果需要）
   ```
   訪問: http://localhost:3000/admin
   點擊: 清空所有資料
   ```

2. **初始化禮物**
   - **快速測試**: 使用「隨機生成測試資料」
   - **正式活動**: 使用「手動輸入初始資料」

3. **驗證初始化**
   - 使用 Prisma Studio 查看資料:
     ```bash
     npx prisma studio
     ```
   - 確認 Grid 表有 30 筆記錄
   - 確認 Submission 表有 30 筆記錄（status: 'completed'）

---

### 參加者流程（前端）

訪問: `http://localhost:3000`

1. **步驟 1: 輸入驗證碼**
   - 驗證碼: `123456`

2. **步驟 2: 選擇類型**
   - 點擊 A / B / C 其中一個

3. **步驟 3: 填寫留言**
   - 最多 20 字

4. **步驟 4: 填寫聯絡資訊**
   - 姓名 *（必填）
   - LINE ID（選填）
   - Instagram（選填）

5. **步驟 5: 抽獎結果**
   - 顯示抽到的格子編號
   - 顯示上一個參加者的資訊（用於列印）
   - 點擊「確認完成交換」寫入資料庫

---

## 📊 資料庫查詢

### 使用 Prisma Studio（推薦）
```bash
npx prisma studio
```
訪問: `http://localhost:5555`

### 使用 DB GUI 軟體
參考: `/docs/database-connection.md`

---

## 🐛 常見問題

### Q: 初始化失敗，提示「資料庫中已有資料」
**A**: 需要先清空資料再初始化
```
1. 訪問 /admin
2. 點擊「清空所有資料」
3. 再次執行初始化
```

### Q: 抽獎失敗，提示「所有格子都被佔用」
**A**: 可能原因：
1. 還沒有初始化格子 → 前往 `/admin` 初始化
2. 所有格子都在 pending 狀態（被鎖定但未完成）
   - 解決方法：等待 5 分鐘自動解鎖
   - 或使用資料庫工具手動解鎖

### Q: 如何手動解鎖格子？
**A**: 使用 Prisma Studio 或 DB GUI:
```sql
-- 將所有 pending 狀態改為 completed
UPDATE "Submission"
SET status = 'completed',
    completedAt = NOW()
WHERE status = 'pending';

-- 解鎖所有格子
UPDATE "Grid"
SET status = 'available'
WHERE status = 'locked';
```

### Q: 如何查看當前有多少參加者？
**A**:
```sql
SELECT COUNT(*) FROM "Submission" WHERE status = 'completed';
```

### Q: 如何重置參加者編號？
**A**:
```sql
-- 刪除所有記錄後重置序列
TRUNCATE TABLE "Submission" CASCADE;
ALTER SEQUENCE "Submission_id_seq" RESTART WITH 1;
```

---

## 🔐 生產環境建議

### 1. 保護管理頁面
添加簡單密碼保護（可選）:
```typescript
// src/app/[lang]/admin/page.tsx
const [password, setPassword] = useState('')
const [isAuthorized, setIsAuthorized] = useState(false)

if (!isAuthorized) {
  return <PasswordForm onSuccess={() => setIsAuthorized(true)} />
}
```

### 2. 修改驗證碼
```typescript
// src/app/api/validate/route.ts
const CORRECT_PASSWORD = '你的安全密碼'
```

### 3. 限制訪問
- 使用防火牆限制 `/admin` 只能從特定 IP 訪問
- 或使用 Vercel 的 Basic Auth

### 4. i18n 路由說明
- 當前預設語言：`zh-TW`（shortCode: `zh`）
- 管理頁面路徑：`/admin`（會 rewrite 到 `/zh/admin` 處理）
- 參加者頁面：`/`（會 rewrite 到 `/zh` 處理）
- 如需支援其他語言（如英文），取消註解 `i18n.config.ts` 中的 `en-US` 設定
- 英文版本路徑：`/en/admin`（需要明確指定語言）

---

## 📚 相關文檔

- [架構設計](./docs/architecture-review.md)
- [資料庫連線](./docs/database-connection.md)
- [開發環境設置](./README-SETUP.md)
- [遊戲說明](./遊戲說明.md)
