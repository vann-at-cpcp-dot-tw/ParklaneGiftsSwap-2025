import { NextResponse } from 'next/server'

import { prisma } from '~/lib/prisma'

/**
 * GET /api/admin/pending
 * 獲取所有待審核記錄列表
 * 用於 admin/approve 頁面顯示
 */
export async function GET() {
  try {
    const pendingSubmissions = await prisma.pendingSubmission.findMany({
      include: {
        grid: true,
      },
      orderBy: { createdAt: 'asc' }, // 先進先出
    })

    const result = pendingSubmissions.map((pending) => ({
      id: pending.id,
      giftType: pending.giftType,
      message: pending.message,
      name: pending.name,
      lineId: pending.lineId,
      instagram: pending.instagram,
      gridNumber: pending.grid.gridNumber,
      assignedGridId: pending.assignedGridId,
      previousSubmission: pending.previousSubmission as any,
      matchedPreference: pending.matchedPreference,
      createdAt: pending.createdAt,
    }))

    return NextResponse.json({
      pendingSubmissions: result,
    })
  } catch (error: any) {
    console.error('獲取待審核列表失敗:', error)
    return NextResponse.json(
      { error: '獲取失敗', details: error.message },
      { status: 500 }
    )
  }
}
