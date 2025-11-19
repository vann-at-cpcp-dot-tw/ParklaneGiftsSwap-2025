import { NextResponse } from 'next/server'

import { prisma } from '~/lib/prisma'

// GET /api/admin/grids - 列出所有格子狀態
export async function GET() {
  try {
    const grids = await prisma.grid.findMany({
      orderBy: { gridNumber: 'asc' },
      select: {
        id: true,
        gridNumber: true,
        currentGiftType: true,
        status: true,
        disabled: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      grids,
    })
  } catch (error: any) {
    console.error('查詢格子列表失敗:', error)

    return NextResponse.json(
      { error: '查詢格子列表失敗', details: error.message },
      { status: 500 }
    )
  }
}
