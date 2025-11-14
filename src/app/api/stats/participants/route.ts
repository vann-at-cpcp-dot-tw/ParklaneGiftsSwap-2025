import { NextResponse } from 'next/server'
import { prisma } from '~/lib/prisma'

/**
 * 取得真實參加者統計資訊
 * GET /api/stats/participants
 *
 * 回傳：
 * - totalReal: 真實參加者總數
 * - nextRealParticipantNo: 下一個真實參加者編號
 * - participants: 真實參加者列表（已完成的）
 */
export async function GET() {
  try {
    // 查詢所有真實參加者（不包含預設禮物）
    const realParticipants = await prisma.submission.findMany({
      where: {
        isInitialGift: false, // 只查真實參加者
        status: 'completed',   // 已完成交換的
      },
      select: {
        id: true,
        participantNumber: true,
        realParticipantNo: true,
        giftType: true,
        name: true,
        createdAt: true,
        completedAt: true,
      },
      orderBy: { realParticipantNo: 'asc' },
    })

    // 計算下一個真實參加者編號
    const lastRealParticipant = await prisma.submission.findFirst({
      where: { isInitialGift: false },
      orderBy: { realParticipantNo: 'desc' },
    })
    const nextRealParticipantNo = (lastRealParticipant?.realParticipantNo || 0) + 1

    return NextResponse.json({
      success: true,
      totalReal: realParticipants.length,
      nextRealParticipantNo,
      participants: realParticipants.map(p => ({
        id: p.id,
        globalNo: p.participantNumber,     // 全局編號（包含預設禮物）
        realNo: p.realParticipantNo,       // 真實編號（1, 2, 3...）
        name: p.name,
        giftType: p.giftType,
        createdAt: p.createdAt,
        completedAt: p.completedAt,
      })),
    })
  } catch (error: any) {
    console.error('取得參加者統計失敗:', error)
    return NextResponse.json(
      { error: '取得統計資料失敗', details: error.message },
      { status: 500 }
    )
  }
}
