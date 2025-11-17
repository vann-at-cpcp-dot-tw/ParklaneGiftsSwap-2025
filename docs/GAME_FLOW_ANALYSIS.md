# 完整遊戲流程分析

## 🎯 核心設計原則

1. **前端抽選 + 後端審核**：前端先抽格子，提交後創建 Pending，管理員審核後才寫入正式記錄
2. **全局鎖定機制**：任何時候只要有 Pending，所有 iPad 都鎖定在 Result 頁
3. **禮物無限輪轉**：格子狀態永遠是 available（除了短暫的 locked），沒有 occupied

---

## 📱 前端流程（7 個步驟）

```
初始化
  ↓
[Welcome] → 調用 /api/submissions/next-number 取得預估編號
  ↓ 點擊「開始」
[Test] → 6 題問卷 → 計算 giftType (A/B/C)
  ↓ 答完題
[Message] → 填寫留言（限 20 字）
  ↓ 下一步
[Contact] → 填寫 name（必填）, lineId, instagram
  ↓ 下一步
[MyType] → 顯示測驗結果（giftType）
  ↓ 下一步
[Draw] → 選擇偏好（same/different/random）
  ├→ 調用 /api/grids/preview（查詢可用格子，不鎖定）
  ├→ 前端隨機選一個格子
  ├→ 存入 gameState.drawResult（包含 previousSubmission）
  └→ 判斷是否 matchedPreference
       ├→ true  → 直接進入 Result
       └→ false → 彈出「目前此頻道缺人中」→ 點擊 OK → Result
  ↓
[Result] → 顯示「恭喜你完成配對任務」
  ├→ 判斷狀態：
  │   ├─ !drawResult && !pendingId  → 顯示「其他參加者正在審核中...」（全局鎖）
  │   ├─ pendingId 有值             → 顯示「審核中，請稍候...」（自己的申請）
  │   └─ 正常                       → 顯示「GO！」按鈕
  │
  ├→ 點擊 GO：
  │   └→ 調用 /api/submissions POST（創建 Pending + 鎖定格子）
  │       └→ 成功後輪詢 /api/pending/[id]（每 2 秒）
  │           ├→ status='pending'    → 繼續等待
  │           └→ status='processed'  → 跳回 Welcome
  │
  └→ 輪詢錯誤處理：
      └→ 連續 3 次失敗 → 顯示「網路連線異常」
```

---

## 🔄 後端狀態機

### Grid 狀態轉換
```
[available] ←→ [locked]
     ↑           ↓
     └───────────┘
```

- `available` → `locked`：用戶點擊 GO，創建 Pending
- `locked` → `available`：管理員審核通過或拒絕

### Submission 生命週期
```
初始化：30 個 isInitialGift=true, realParticipantNo=null
         ↓
用戶提交 → PendingSubmission (locked grid)
         ↓
管理員審核 → 分支：
  ├─ 通過 → Submission (isInitialGift=false, realParticipantNo=遞增)
  └─ 拒絕 → PendingSubmission 被刪除（不佔編號）
```

---

## 🔍 潛在問題分析

### ✅ 已確認正常的場景

1. **並發提交同一格子**
   - Transaction 內檢查格子狀態
   - 只有一個會成功

2. **並發審核同一個 Pending**
   - Transaction 開始時先 deleteMany
   - 第二個請求正確返回 404

3. **realParticipantNo 連續性**
   - 排除 isInitialGift=false
   - UNIQUE 約束防止重複

4. **全局鎖定語義**
   - 只返回 hasPending: boolean
   - 不返回 pendingId，防止誤用

---

### 🤔 需要驗證的場景

#### 場景 1：用戶在 Draw 頁停留過久
**情況**：
```
1. 用戶 A 在 Draw 頁選擇偏好
2. 調用 /api/grids/preview 查詢可用格子（此時不鎖定）
3. 用戶 A 停留 10 分鐘（沒點擊 OK）
4. 其間，用戶 B 提交並佔用了同一個格子
5. 用戶 A 回來點擊 OK → 進入 Result 頁 → 點擊 GO
```

**問題**：用戶 A 的 gameState.drawResult 中的 assignedGridId 可能已經被鎖定

**檢查點**：`/api/submissions` 是否正確處理？

---

#### 場景 2：管理員審核通過，但列印失敗
**情況**：
```
1. 管理員點擊「審核通過」
2. 前端先調用 print() → 假設成功（按測試要求）
3. 前端調用 /api/admin/pending/[id]/approve
4. 後端創建 Submission，刪除 Pending
```

**問題**：如果列印真的失敗，會怎樣？

**檢查點**：Admin 頁面的邏輯是否正確？

---

#### 場景 3：Preview API 的 excludeLast 降級
**情況**：
```
1. 30 個格子都有禮物
2. 最近 2 個被抽中的是 Grid #1 和 #2
3. 用戶選擇 preferSameType=true，且只有 Grid #1 和 #2 符合
4. excludeLast=2 排除了它們
5. 降級策略逐步放寬
```

**問題**：降級邏輯是否正確？會不會死循環？

**檢查點**：`/api/grids/preview` 的降級邏輯

---

#### 場景 4：前端輪詢期間，網路斷開
**情況**：
```
1. 用戶提交 → pendingId=123
2. 開始輪詢 /api/pending/123
3. 網路斷開 → 連續 3 次失敗
4. 顯示錯誤訊息
5. 網路恢復
```

**問題**：輪詢會自動恢復嗎？還是永遠卡住？

**檢查點**：Result.tsx 的 useEffect 依賴

---

#### 場景 5：數據庫中有孤兒 Pending
**情況**：
```
1. 用戶提交 → pendingId=123，Grid #5 鎖定
2. 管理員頁面崩潰（未審核）
3. Pending 永遠存在，Grid #5 永遠 locked
```

**問題**：有沒有清理機制？

**檢查點**：是否需要 timeout 清理？

---

#### 場景 6：Grid 的 currentGiftType 不一致
**情況**：
```
1. Grid #5 的 currentGiftType='A'
2. 新用戶提交 giftType='B' 到 Grid #5
3. 創建 Pending
4. 管理員拒絕
5. Grid #5 的 currentGiftType 還是 'A'（正確）
```

**問題**：拒絕時需要更新嗎？

**檢查點**：reject API 是否需要處理？

---

## 📝 測試計畫

### 測試 1：Draw 頁停留過久
- 模擬：Preview → 等待 → 提交
- 驗證：是否正確返回 409 conflict

### 測試 2：Admin 審核流程
- 模擬：提交 → 審核通過（假設列印成功）
- 驗證：Submission 創建，Pending 刪除，Grid 釋放

### 測試 3：Preview 降級策略
- 模擬：排除最近 2 個 → 查詢
- 驗證：降級邏輯正確運作

### 測試 4：輪詢錯誤恢復
- 模擬：提交 → 模擬網路錯誤 → 恢復
- 驗證：是否能自動恢復輪詢

### 測試 5：孤兒 Pending 檢測
- 模擬：創建 Pending 不審核
- 驗證：是否會永久鎖定格子

### 測試 6：拒絕後的數據一致性
- 模擬：提交 → 拒絕
- 驗證：Grid 狀態正確

---

## 🎯 下一步

1. 為每個場景編寫測試
2. 執行測試並查詢數據庫
3. 修復發現的問題
4. 最終數據完整性驗證
