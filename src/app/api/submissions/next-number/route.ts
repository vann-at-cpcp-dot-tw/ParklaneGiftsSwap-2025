import { NextResponse } from 'next/server'

import { prisma } from '~/lib/prisma'

/**
 * 取得下一個真實參加者編號
 * GET /api/submissions/next-number
 *
 * 回傳：
 * - nextRealParticipantNo: 下一個真實參加者編號
 * - totalReal: 目前真實參加者總數
 */
export async function GET() {
  try {
    // 取得最後一個真實參加者編號
    const lastRealParticipant = await prisma.submission.findFirst({
      where: { isInitialGift: false },
      orderBy: { realParticipantNo: 'desc' },
    })
    const nextRealParticipantNo = (lastRealParticipant?.realParticipantNo || 0) + 1

    // 計算真實參加者總數
    const totalReal = await prisma.submission.count({
      where: {
        isInitialGift: false,
        status: 'completed',
      },
    })

    return NextResponse.json({
      success: true,
      nextRealParticipantNo,
      totalReal,
    })
  } catch (error: any) {
    console.error('取得參加者編號失敗:', error)
    return NextResponse.json(
      { error: '取得參加者編號失敗', details: error.message },
      { status: 500 }
    )
  }
}
