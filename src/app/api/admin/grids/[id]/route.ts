import { NextResponse } from 'next/server'

import { prisma } from '~/lib/prisma'

// PUT /api/admin/grids/[id] - 切換格子禁用狀態
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const gridId = parseInt(id, 10)

    if (isNaN(gridId)) {
      return NextResponse.json(
        { error: '無效的格子 ID' },
        { status: 400 }
      )
    }

    // 查詢當前格子狀態
    const grid = await prisma.grid.findUnique({
      where: { id: gridId },
    })

    if (!grid) {
      return NextResponse.json(
        { error: '格子不存在' },
        { status: 404 }
      )
    }

    // 如果要禁用格子，檢查是否有 PendingSubmission 正在使用
    if (!grid.disabled) {
      const pendingSubmission = await prisma.pendingSubmission.findFirst({
        where: { assignedGridId: gridId },
      })

      if (pendingSubmission) {
        return NextResponse.json(
          { error: `格子 ${grid.gridNumber} 正在審核中，請先處理審核後再禁用` },
          { status: 409 }
        )
      }
    }

    // 切換禁用狀態
    const updatedGrid = await prisma.grid.update({
      where: { id: gridId },
      data: { disabled: !grid.disabled },
    })

    return NextResponse.json({
      success: true,
      grid: {
        id: updatedGrid.id,
        gridNumber: updatedGrid.gridNumber,
        disabled: updatedGrid.disabled,
      },
      message: updatedGrid.disabled
        ? `格子 ${updatedGrid.gridNumber} 已禁用，不再參與抽選`
        : `格子 ${updatedGrid.gridNumber} 已啟用，恢復參與抽選`,
    })
  } catch (error: any) {
    console.error('切換格子禁用狀態失敗:', error)

    return NextResponse.json(
      { error: '切換格子禁用狀態失敗', details: error.message },
      { status: 500 }
    )
  }
}
