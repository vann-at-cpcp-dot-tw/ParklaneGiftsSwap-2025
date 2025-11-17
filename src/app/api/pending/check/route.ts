import { NextResponse } from 'next/server'

import { prisma } from '~/lib/prisma'

/**
 * GET /api/pending/check
 * 檢查是否有待審核記錄（全局鎖定機制）
 *
 * 設計理念：
 * - 只返回 boolean，不返回具體 pendingId
 * - 語義：「有人在排隊」而不是「輪詢這個 ID」
 * - 前端：有 pending 就全局鎖定在 result 頁，不做個人輪詢
 */
export async function GET() {
  try {
    const pendingCount = await prisma.pendingSubmission.count()

    return NextResponse.json({
      hasPending: pendingCount > 0,
    })
  } catch (error: any) {
    console.error('檢查待審核記錄失敗:', error)
    return NextResponse.json(
      { error: '檢查失敗', details: error.message },
      { status: 500 }
    )
  }
}
