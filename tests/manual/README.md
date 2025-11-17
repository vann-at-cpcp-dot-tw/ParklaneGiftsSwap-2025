# 手動測試腳本

這個資料夾包含用於驗證禮物交換遊戲系統的手動測試腳本。

## 腳本說明

### verify-db-integrity.ts
**用途**：驗證數據庫完整性和數據一致性

**檢查項目**：
- Grid 表是否恰好 30 行，狀態是否都是 available
- participantNumber 是否連續無跳號
- realParticipantNo 是否連續無跳號（排除初始禮物）
- 初始禮物的 realParticipantNo 是否都為 null
- Grid 的 currentGiftType 是否與最新 Submission 一致

**執行方式**：
```bash
cd tests/manual
npx tsx verify-db-integrity.ts
```

**使用時機**：
- 活動結束後驗證數據完整性
- 修改數據庫相關代碼後的回歸測試
- 發現數據異常時的診斷工具

---

### test-edge-cases.ts
**用途**：測試系統的邊界條件和特殊場景

**測試場景**（共 6 個場景，24 個測試點）：
1. Draw 頁停留過久（測試 Transaction 防護）
2. Admin 審核流程（測試完整的提交→審核→清理流程）
3. Preview 降級策略（測試 4 層降級邏輯）
4. 輪詢恢復機制（測試 API 穩定性）
5. 孤兒 Pending 檢測（測試全局鎖定）
6. 拒絕後一致性（測試數據一致性）

**執行方式**：
```bash
# 確保開發伺服器運行
npm run dev

# 在另一個終端執行測試
cd tests/manual
npx tsx test-edge-cases.ts
```

**使用時機**：
- 修改核心業務邏輯後的回歸測試
- 部署前的完整驗證
- 重現和調試邊界條件 bug

---

## 注意事項

1. **test-edge-cases.ts** 會創建測試數據（PendingSubmission、Submission），執行前確保這是測試環境
2. **verify-db-integrity.ts** 是只讀操作，可以安全地在任何環境執行
3. 兩個腳本都需要數據庫連線，確保 `.env` 配置正確

---

## 測試數據清理

如果測試後需要清理數據，可以執行：
```bash
npx prisma studio
# 在 Prisma Studio 中手動刪除測試記錄
```
