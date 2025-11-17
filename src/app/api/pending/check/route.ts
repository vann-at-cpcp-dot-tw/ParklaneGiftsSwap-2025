import { NextResponse } from 'next/server'

import { prisma } from '~/lib/prisma'

/**
 * GET /api/pending/check
 * 檢查是否有待審核記錄
 * 用於初始化時判斷是否需要強制進入 result 頁
 */
export async function GET() {
  try {
    const pending = await prisma.pendingSubmission.findFirst({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      hasPending: !!pending,
      pendingId: pending?.id || null,
    })
  } catch (error: any) {
    console.error('檢查待審核記錄失敗:', error)
    return NextResponse.json(
      { error: '檢查失敗', details: error.message },
      { status: 500 }
    )
  }
}
