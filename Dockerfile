# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# 複製 package files
COPY package*.json ./
COPY prisma ./prisma/

# 安裝依賴
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# 接收 build-time 參數
ARG NEXT_PUBLIC_PRINTER_IP
ARG NEXT_PUBLIC_APP_BASE

# 設置為環境變數供 Next.js build 使用
ENV NEXT_PUBLIC_PRINTER_IP=$NEXT_PUBLIC_PRINTER_IP
ENV NEXT_PUBLIC_APP_BASE=$NEXT_PUBLIC_APP_BASE

# 複製依賴
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 創建非 root 用戶
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 複製 package files（用於安裝 Prisma CLI）
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# 只安裝 Prisma CLI（精確版本 6.19.0）
RUN npm install prisma@6.19.0 --no-save

# 複製必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# 切換用戶
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 啟動腳本（先跑 migration，再啟動應用）
CMD npx prisma migrate deploy && node server.js
