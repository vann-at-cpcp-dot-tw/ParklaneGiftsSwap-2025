import { NextResponse } from 'next/server'

import { prisma } from '~/lib/prisma'

/**
 * 獲取所有格子資料
 * GET /api/grids
 */
export async function GET() {
  try {
    const grids = await prisma.grid.findMany({
      select: {
        id: true,
        gridNumber: true
      },
      orderBy: {
        gridNumber: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      grids
    })
  } catch (error: any) {
    console.error('獲取格子資料失敗:', error)
    return NextResponse.json(
      { error: '獲取格子資料失敗', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * 清空所有格子和提交記錄（危險操作）
 * DELETE /api/grids
 */
export async function DELETE() {
  try {
    // 檢查是否有待審核記錄（防止中斷進行中的遊戲）
    const pendingCount = await prisma.pendingSubmission.count()
    if (pendingCount > 0) {
      return NextResponse.json(
        {
          error: '無法清空資料：目前有待審核記錄',
          details: `有 ${pendingCount} 筆待審核記錄，請先處理完畢再清空`
        },
        { status: 409 }
      )
    }

    // 使用事務清空所有資料
    await prisma.$transaction(async (tx) => {
      // 1. 刪除所有提交記錄
      await tx.submission.deleteMany({})

      // 2. 刪除所有格子
      await tx.grid.deleteMany({})
    })

    return NextResponse.json({
      success: true,
      message: '成功清空所有資料',
    })
  } catch (error: any) {
    console.error('清空資料失敗:', error)
    return NextResponse.json(
      { error: '清空資料失敗', details: error.message },
      { status: 500 }
    )
  }
}
