# 禮物交換遊戲 - 開發環境設置指南

## 🚀 快速開始

### 1. 啟動資料庫

```bash
# 啟動 PostgreSQL Docker 容器
docker compose up -d

# 檢查容器狀態
docker compose ps
```

### 2. 初始化資料庫結構

```bash
# 推送 Prisma Schema 到資料庫（已完成）
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/parklane_gifts" npx prisma db push
```

### 3. 啟動開發伺服器

```bash
npm run dev
```

### 4. 初始化 30 個格子

**推薦方式：使用管理頁面**
```
訪問: http://localhost:3000/admin
點擊: 隨機生成測試資料 或 手動輸入初始資料
```

**或使用 API（已棄用）**：
```bash
curl -X POST http://localhost:3000/api/init-grids
```

> 注意：推薦使用管理頁面，因為它會同時創建格子和初始禮物記錄

---

## 📋 完整流程測試

### 步驟 1：訪問首頁
```
http://localhost:3000
```

### 步驟 2：輸入驗證碼
- 驗證碼：`123456`

### 步驟 3：選擇類型
- 點擊「類型 A」、「類型 B」或「類型 C」

### 步驟 4：填寫留言
- 最多 20 字
- 點擊「送出並抽獎」

### 步驟 5：查看結果
- 顯示抽到的格子編號
- 顯示上一個參加者的資訊
- 點擊「確認完成交換」寫入資料庫

---

## 🗂 資料庫管理

### 查看資料庫內容

使用 Prisma Studio：
```bash
npx prisma studio
```

會在瀏覽器開啟 GUI 介面：`http://localhost:5555`

### 使用 pgAdmin（可選）

啟動 pgAdmin：
```bash
docker compose --profile tools up -d
```

訪問：`http://localhost:5050`
- Email: `admin@parklane.local`
- Password: `admin`

連接資料庫：
- Host: `host.docker.internal` (Mac) 或 `172.17.0.1` (Linux)
- Port: `5432`
- Database: `parklane_gifts`
- Username: `postgres`
- Password: `postgres`

---

## 📡 API 端點

### 1. 初始化格子
```bash
POST /api/init-grids
```

### 2. 抽獎
```bash
POST /api/draw
Content-Type: application/json

{
  "giftType": "A",  # "A" | "B" | "C"
  "message": "這是我的留言"
}
```

### 3. 完成交換
```bash
POST /api/complete
Content-Type: application/json

{
  "submissionId": 1
}
```

---

## 🛠 常用指令

### Docker 操作
```bash
# 啟動
docker compose up -d

# 停止
docker compose down

# 查看日誌
docker compose logs postgres

# 重啟資料庫
docker compose restart postgres

# 完全清除（包含資料）
docker compose down -v
```

### Prisma 操作
```bash
# 推送 Schema 變更
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/parklane_gifts" npx prisma db push

# 生成 Prisma Client
npx prisma generate

# 開啟 Prisma Studio
npx prisma studio

# 重置資料庫（清空所有資料）
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/parklane_gifts" npx prisma db push --force-reset
```

---

## 📊 資料庫結構

### Grid（格子表）
- `id`: 自增 ID
- `gridNumber`: 格子編號（1-30）
- `currentGiftType`: 當前禮物類型（'A' | 'B' | 'C' | 'default'）
- `currentParticipantId`: 當前擁有者 ID
- `status`: 狀態（'available' | 'locked'）

### Submission（提交表）
- `id`: 自增 ID
- `participantNumber`: 參加者編號（顯示用）
- `giftType`: 禮物類型（'A' | 'B' | 'C'）
- `message`: 留言（20 字）
- `assignedGridId`: 抽到的格子 ID
- `status`: 狀態（'pending' | 'completed'）
- `expiresAt`: 過期時間（5 分鐘）

---

## 🐛 故障排除

### 資料庫連線失敗
```bash
# 檢查容器是否運行
docker compose ps

# 檢查容器日誌
docker compose logs postgres
```

### Prisma Client 找不到
```bash
# 重新生成
npx prisma generate
```

### 端口被佔用
```bash
# 查看誰在使用 5432 端口
lsof -i :5432

# 修改 docker-compose.yml 中的端口映射
# ports:
#   - "5433:5432"  # 改用 5433
```

---

## 🚢 生產環境部署

### 使用 Node + PM2

1. **啟動資料庫**（生產伺服器上）
```bash
docker compose -f docker-compose.prod.yml up -d
```

2. **建置前端**
```bash
npm run build
```

3. **使用 PM2 啟動**
```bash
pm2 start npm --name "parklane-gifts" -- start
pm2 save
```

---

## 📝 注意事項

1. **環境變數**: 生產環境記得修改 `.env.local` 為 `.env.production`
2. **資料庫密碼**: 生產環境使用強密碼
3. **備份**: 定期備份 PostgreSQL 資料
4. **超時機制**: 背景任務需要定期清理過期的 `pending` 記錄

---

## 🔗 相關文件

- [架構設計文檔](./docs/architecture-review.md)
- [遊戲說明](./遊戲說明.md)
- [Prisma 文檔](https://www.prisma.io/docs)
- [Next.js 文檔](https://nextjs.org/docs)
