# i18n 路由說明

## 📋 當前設定

### 語言配置
位置：`/i18n.config.ts`

```typescript
const locales = [
  {
    code: 'zh-TW',
    shortCode: 'zh',
    name: '繁體中文'
  },
  // 其他語言已註解
]

預設語言：zh-TW
```

---

## 🌐 路由結構

### 基本規則
所有頁面都在 `src/app/[lang]` 下，路由會自動包含語言前綴。

### 路由對應表

| 檔案位置 | 用戶訪問 URL | 實際處理路徑 | 說明 |
|---------|------------|------------|------|
| `src/app/[lang]/(home)/page.tsx` | `/` | `/zh` | 首頁（參加者流程）|
| `src/app/[lang]/admin/page.tsx` | `/admin` | `/zh/admin` | 管理頁面 |
| `src/app/api/validate/route.ts` | `/api/validate` | `/api/validate` | 驗證碼 API |
| `src/app/api/draw/route.ts` | `/api/draw` | `/api/draw` | 抽獎 API |
| `src/app/api/complete/route.ts` | `/api/complete` | `/api/complete` | 完成交換 API |
| `src/app/api/admin/*` | `/api/admin/*` | `/api/admin/*` | 管理 API |

---

## 🔧 訪問方式

### 開發環境

#### 參加者頁面
```
http://localhost:3000/
```
> 訪問 `/` 會自動 rewrite 到 `/zh` 處理

#### 管理頁面
```
http://localhost:3000/admin
```
> 訪問 `/admin` 會自動 rewrite 到 `/zh/admin` 處理

#### API 端點（無需語言前綴）
```
http://localhost:3000/api/validate
http://localhost:3000/api/draw
http://localhost:3000/api/complete
http://localhost:3000/api/admin/init-random
http://localhost:3000/api/admin/init-manual
http://localhost:3000/api/admin/reset
```

---

### 生產環境

將 `localhost:3000` 替換為實際域名：

```
https://your-domain.com/        # 參加者頁面
https://your-domain.com/admin    # 管理頁面
```

如果要訪問其他語言（英文）：
```
https://your-domain.com/en       # 英文參加者頁面
https://your-domain.com/en/admin # 英文管理頁面
```

---

## 🌍 啟用其他語言

### 步驟 1：取消註解語言設定

編輯 `/i18n.config.ts`：

```typescript
const locales = [
  {
    code: 'zh-TW',
    shortCode: 'zh',
    name: '繁體中文'
  },
  {
    code: 'en-US',  // 取消註解
    shortCode: 'en',
    name: 'English'
  },
]
```

### 步驟 2：重新啟動開發伺服器

```bash
npm run dev
```

### 步驟 3：訪問英文版本

```
http://localhost:3000/en        # 英文參加者頁面
http://localhost:3000/en/admin  # 英文管理頁面
```

> 注意：非預設語言需要明確指定語言前綴

---

## 📝 注意事項

### 1. API 路由不需要語言前綴
所有 `src/app/api` 下的路由**不需要**語言前綴，因為 API 是語言無關的。

### 2. 預設語言不需要前綴
訪問預設語言（zh）的頁面時，不需要加 `/zh` 前綴：
- `/` → 自動 rewrite 到 `/zh`
- `/admin` → 自動 rewrite 到 `/zh/admin`

### 3. 非預設語言需要明確前綴
訪問其他語言時，需要明確指定語言前綴：
- `/en` → 英文首頁
- `/en/admin` → 英文管理頁面

### 4. 語言切換
如果要實現語言切換功能，需要：
1. 啟用多個語言
2. 添加語言選擇器組件
3. 使用 `next-intl` 或類似的 i18n 庫處理翻譯

---

## 🔗 相關資源

- [Next.js i18n 文檔](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [專案 i18n 設定](../i18n.config.ts)
- [管理頁面使用指南](../README-ADMIN.md)
