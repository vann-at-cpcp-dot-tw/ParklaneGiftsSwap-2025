# 禮物交換遊戲系統 - 部署指南

## 系統需求

- **Docker Desktop**（[下載連結](https://www.docker.com/products/docker-desktop/)）
- **Windows 10/11** 或 **macOS 10.15+** 或 **Linux**
- 至少 **4GB RAM** 和 **10GB 硬碟空間**

---

## 首次安裝

### 1. 安裝 Docker Desktop

1. 下載並安裝 [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. 啟動 Docker Desktop
3. 等待底部狀態顯示 "Docker Desktop is running"

### 2. 解壓專案

將 `parklane-gifts-vX.X.zip` 解壓到任意位置，例如：
- Windows: `C:\parklane-gifts`
- Mac/Linux: `~/parklane-gifts`

### 3. 設定環境變數

```bash
# 進入專案目錄
cd /path/to/parklane-gifts

# 複製範例檔案
cp .env.example .env

# 編輯 .env（Windows 用記事本，Mac 用 TextEdit）
# 必須修改以下兩項：
```

**.env 必填項目**：

```env
# 管理員密碼（請設定強密碼，用於訪問 /admin）
ADMIN_PASSWORD="your-secure-password-here"

# 印表機 IP（改為您的 Epson 印表機 IP）
NEXT_PUBLIC_PRINTER_IP="192.168.0.123"
```

### 4. 啟動服務

```bash
# 首次啟動（會自動 build，需要 5-10 分鐘）
docker compose up -d --build
```

### 5. 初始化遊戲

1. 打開瀏覽器訪問：`http://localhost:3000/admin`
2. 輸入您在 `.env` 設定的管理員密碼
3. 點擊 **"🎲 隨機生成測試資料"** 或 **"📝 手動輸入初始資料"**

### 6. 開始使用

- **遊戲網址**：`http://localhost:3000`
- **管理介面**：`http://localhost:3000/admin`
- **查看記錄**：`http://localhost:3000/admin/log`

**其他裝置訪問**（同一 WiFi）：
- 查詢您的電腦 IP：
  - Windows: `ipconfig`（找 IPv4 位址）
  - Mac: `ifconfig`（找 inet）
- 在 iPad/手機訪問：`http://[您的電腦IP]:3000`

---

## 更新版本

當收到新版本 `parklane-gifts-vX.X.zip` 時：

```bash
# 1. 停止服務（資料不會遺失）
docker compose down

# 2. 備份 .env（保險起見，通常不需要）
cp .env .env.backup

# 3. 解壓新版本到同一位置（直接覆蓋）
# Windows: 右鍵解壓並選擇「覆蓋所有文件」
# Mac/Linux:
unzip -o parklane-gifts-vX.X.zip

# 4. 重新啟動（會自動 rebuild）
docker compose up -d --build

# 5. 檢查是否需要新增環境變數（查看 CHANGELOG.txt）
# 如果有新增變數，編輯 .env 添加
```

**重要**：
- ✅ 您的 `.env` 不會被覆蓋（壓縮包不包含此檔案）
- ✅ 資料庫資料不會遺失（存在 Docker Volume）
- ✅ 只有程式碼會更新

---

## 常用指令

### 服務管理

```bash
# 啟動服務
docker compose up -d

# 停止服務
docker compose down

# 重啟服務
docker compose restart

# 查看服務狀態
docker compose ps
```

### 日誌查看

```bash
# 查看即時日誌（按 Ctrl+C 退出）
docker compose logs -f app

# 查看最近 100 行日誌
docker compose logs --tail=100 app

# 查看所有服務日誌
docker compose logs -f
```

### 資料庫管理

```bash
# 進入資料庫容器
docker compose exec postgres psql -U postgres -d parklane_gifts

# 備份資料庫
docker compose exec postgres pg_dump -U postgres parklane_gifts > backup.sql

# 還原資料庫
docker compose exec -T postgres psql -U postgres parklane_gifts < backup.sql
```

---

## Windows 重開機自動啟動

### 方法 1：Docker Desktop 設定（推薦）

1. 打開 **Docker Desktop**
2. 點擊右上角⚙️ **Settings**
3. **General** 標籤：
   - ✅ 勾選 **"Start Docker Desktop when you log in"**
4. **Resources** → **Advanced**：
   - ✅ 勾選 **"Start Docker when you sign in"**（如果有）

### 方法 2：工作排程器

1. 按 `Win + R`，輸入 `taskschd.msc`
2. 建立基本工作：
   - 觸發程序：**登入時**
   - 動作：**啟動程式**
   - 程式：`C:\Program Files\Docker\Docker\Docker Desktop.exe`
3. 再建立第二個工作：
   - 觸發程序：**登入時**（延遲 30 秒）
   - 動作：**啟動程式**
   - 程式：`docker`
   - 參數：`compose -f C:\parklane-gifts\docker-compose.yml up -d`
   - 起始於：`C:\parklane-gifts`

---

## 環境變數說明

| 變數名稱 | 說明 | 範例 | 必填 |
|---------|------|------|------|
| `DATABASE_URL` | 資料庫連線（通常不用改） | `postgresql://postgres:postgres@localhost:5432/parklane_gifts` | ✅ |
| `NEXT_PUBLIC_APP_BASE` | 網站根路徑（通常是 `/`） | `/` | ✅ |
| `ADMIN_PASSWORD` | 管理員密碼 | `mySecurePassword123` | ✅ |
| `NEXT_PUBLIC_PRINTER_IP` | 印表機 IP | `192.168.0.123` | ✅ |

---

## 故障排除

### 問題 1：無法啟動

**錯誤訊息**：`Cannot connect to the Docker daemon`

**解決方法**：
1. 確認 Docker Desktop 是否運行
2. 重啟 Docker Desktop
3. 重新執行 `docker compose up -d`

---

### 問題 2：3000 port 被占用

**錯誤訊息**：`port is already allocated`

**解決方法 A**：停止占用的程式
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID號碼] /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

**解決方法 B**：改用其他 port

編輯 `docker-compose.yml`：
```yaml
app:
  ports:
    - "8080:3000"  # 改為 8080 port
```

然後訪問：`http://localhost:8080`

---

### 問題 3：列印失敗

**檢查項目**：
1. 印表機是否開啟？
2. 電腦和印表機是否在同一網路？
3. `.env` 中的 `NEXT_PUBLIC_PRINTER_IP` 是否正確？

**測試印表機連線**：
```bash
# 測試是否能連到印表機
ping 192.168.0.123

# 在瀏覽器測試（應該會下載檔案或顯示錯誤）
http://192.168.0.123/cgi-bin/epos/service.cgi
```

---

### 問題 4：忘記管理員密碼

```bash
# 1. 停止服務
docker compose down

# 2. 編輯 .env，修改 ADMIN_PASSWORD

# 3. 重新啟動
docker compose up -d
```

---

### 問題 5：資料庫連線失敗

**錯誤訊息**：`Error: P1001: Can't reach database server`

**解決方法**：
```bash
# 1. 檢查資料庫容器狀態
docker compose ps

# 2. 如果 postgres 狀態異常，重啟
docker compose restart postgres

# 3. 等待 10 秒讓資料庫完全啟動
sleep 10

# 4. 重啟應用
docker compose restart app
```

---

## 完全重置（清空所有資料）

### 方法 1：透過管理介面

1. 訪問 `http://localhost:3000/admin`
2. 點擊 **"🗑️ 清空所有資料"**

### 方法 2：刪除 Docker Volume

```bash
# ⚠️ 警告：此操作會永久刪除所有資料！

# 停止服務並刪除 volumes
docker compose down -v

# 重新啟動
docker compose up -d --build

# 重新初始化（訪問 /admin）
```

---

## 技術支援

如遇問題，請提供：
1. 錯誤訊息截圖
2. 日誌內容：`docker compose logs --tail=100 app > logs.txt`
3. Docker 版本：`docker --version`
4. 作業系統版本

---

## 授權

© 2025 禮物交換遊戲系統
