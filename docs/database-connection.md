# PostgreSQL 資料庫連線資訊

## 📊 連線資訊

```
主機 (Host):        localhost
端口 (Port):        5432
資料庫 (Database):  parklane_gifts
使用者 (Username):  postgres
密碼 (Password):    postgres
```

---

## 🛠 常見 DB GUI 軟體設定

### TablePlus

1. 點擊 `+` 創建新連線
2. 選擇 `PostgreSQL`
3. 填入以下資訊：
   ```
   Name:     Parklane Gifts (自訂名稱)
   Host:     localhost
   Port:     5432
   User:     postgres
   Password: postgres
   Database: parklane_gifts
   ```
4. 點擊 `Test` 測試連線
5. 點擊 `Connect` 連線

---

### DBeaver

1. 點擊 `Database` → `New Database Connection`
2. 選擇 `PostgreSQL`
3. 填入以下資訊：
   ```
   Host:     localhost
   Port:     5432
   Database: parklane_gifts
   Username: postgres
   Password: postgres
   ```
4. 點擊 `Test Connection` 測試
5. 點擊 `Finish` 完成

---

### DataGrip (JetBrains)

1. 點擊 `+` → `Data Source` → `PostgreSQL`
2. 填入以下資訊：
   ```
   Host:     localhost
   Port:     5432
   Database: parklane_gifts
   User:     postgres
   Password: postgres
   ```
3. 點擊 `Test Connection`
4. 點擊 `OK` 完成

---

### Postico (Mac)

1. 點擊 `New Favorite`
2. 填入以下資訊：
   ```
   Nickname: Parklane Gifts (自訂名稱)
   Host:     localhost
   Port:     5432
   User:     postgres
   Password: postgres
   Database: parklane_gifts
   ```
3. 點擊 `Connect`

---

### pgAdmin (Web)

如果仍想使用 pgAdmin，可以透過以下方式啟動：

```bash
# 在 docker-compose.yml 添加 pgAdmin 服務後執行
docker compose up pgadmin -d
```

連線資訊：
- 訪問：`http://localhost:5050`
- Email: `admin@parklane.local`
- Password: `admin`

新增伺服器連線：
```
Host: host.docker.internal (Mac) 或 172.17.0.1 (Linux)
Port: 5432
Database: parklane_gifts
Username: postgres
Password: postgres
```

---

## 📦 資料庫結構

### Grid（格子表）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INT | 自增 ID |
| gridNumber | INT | 格子編號（1-30）|
| currentGiftType | VARCHAR | 當前禮物類型（'A', 'B', 'C', 'default'）|
| currentParticipantId | INT | 當前擁有者 ID |
| status | VARCHAR | 狀態（'available', 'locked'）|
| updatedAt | TIMESTAMP | 更新時間 |

### Submission（提交表）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INT | 自增 ID |
| participantNumber | INT | 參加者編號（顯示用）|
| giftType | VARCHAR | 禮物類型（'A', 'B', 'C'）|
| message | TEXT | 留言（20 字）|
| assignedGridId | INT | 抽到的格子 ID |
| status | VARCHAR | 狀態（'pending', 'completed'）|
| createdAt | TIMESTAMP | 創建時間 |
| completedAt | TIMESTAMP | 完成時間 |
| expiresAt | TIMESTAMP | 過期時間（5 分鐘）|

---

## 🔍 常用 SQL 查詢

### 查看所有格子狀態
```sql
SELECT
  gridNumber,
  currentGiftType,
  status,
  updatedAt
FROM "Grid"
ORDER BY gridNumber;
```

### 查看所有參加者記錄
```sql
SELECT
  participantNumber,
  giftType,
  message,
  assignedGridId,
  status,
  createdAt
FROM "Submission"
ORDER BY participantNumber DESC;
```

### 查看某格子的歷史記錄
```sql
SELECT
  s.participantNumber,
  s.giftType,
  s.message,
  s.status,
  s.completedAt
FROM "Submission" s
WHERE s.assignedGridId = (
  SELECT id FROM "Grid" WHERE gridNumber = 1
)
ORDER BY s.completedAt DESC;
```

### 統計各類型禮物數量
```sql
SELECT
  currentGiftType,
  COUNT(*) as count
FROM "Grid"
GROUP BY currentGiftType;
```

### 查看過期但未完成的記錄
```sql
SELECT
  id,
  participantNumber,
  giftType,
  assignedGridId,
  expiresAt,
  NOW() as current_time
FROM "Submission"
WHERE status = 'pending'
  AND expiresAt < NOW();
```

---

## 🧹 資料庫維護

### 清空所有資料（重置遊戲）
```sql
-- 刪除所有提交記錄
TRUNCATE TABLE "Submission" CASCADE;

-- 重置格子狀態
UPDATE "Grid" SET
  currentGiftType = 'default',
  currentParticipantId = NULL,
  status = 'available';
```

### 重置序列（從 1 開始）
```sql
-- 重置 Submission ID 序列
ALTER SEQUENCE "Submission_id_seq" RESTART WITH 1;

-- 重置 Grid ID 序列
ALTER SEQUENCE "Grid_id_seq" RESTART WITH 1;
```

### 備份資料庫
```bash
# 在終端機執行
docker exec -t parklane_gifts_db pg_dump -U postgres parklane_gifts > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 還原資料庫
```bash
# 在終端機執行
docker exec -i parklane_gifts_db psql -U postgres parklane_gifts < backup_20250113_123456.sql
```

---

## 🚨 故障排除

### 無法連線

1. **檢查容器是否運行**
   ```bash
   docker compose ps
   ```

2. **檢查端口是否開放**
   ```bash
   lsof -i :5432
   ```

3. **查看容器日誌**
   ```bash
   docker compose logs postgres
   ```

### 權限問題

如果出現權限錯誤，可能需要重建容器：
```bash
docker compose down -v
docker compose up -d
```

### 連線超時

檢查防火牆設定，確保 5432 端口未被阻擋。

---

## 📚 相關資源

- [PostgreSQL 官方文檔](https://www.postgresql.org/docs/)
- [Prisma 文檔](https://www.prisma.io/docs)
- [TablePlus](https://tableplus.com/)
- [DBeaver](https://dbeaver.io/)
- [DataGrip](https://www.jetbrains.com/datagrip/)
