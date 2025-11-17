import { NextResponse } from 'next/server'

import { prisma } from '~/lib/prisma'

/**
 * DELETE /api/admin/pending/:id/reject
 * 審核拒絕：直接刪除 PendingSubmission（不留記錄，不佔編號）
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '無效的 ID' },
        { status: 400 }
      )
    }

    // 使用 transaction 釋放格子並刪除 PendingSubmission
    const result = await prisma.$transaction(async (tx) => {
      // 獲取 pending（含格子 ID）
      const pending = await tx.pendingSubmission.findUnique({
        where: { id },
      })

      if (!pending) {
        throw new Error('待審核記錄不存在')
      }

      // 驗證格子狀態（防止並發拒絕覆蓋其他鎖定）
      const grid = await tx.grid.findUnique({
        where: { id: pending.assignedGridId },
      })

      if (!grid) {
        throw new Error('格子不存在')
      }

      if (grid.status !== 'locked') {
        throw new Error('格子狀態異常：不是 locked 狀態，可能已被其他操作處理')
      }

      // 釋放格子鎖定
      await tx.grid.update({
        where: { id: pending.assignedGridId },
        data: { status: 'available' },
      })

      // 刪除 PendingSubmission
      const deleted = await tx.pendingSubmission.delete({
        where: { id },
      })

      return deleted
    })

    return NextResponse.json({
      success: true,
      deletedId: result.id,
    })
  } catch (error: any) {
    // Prisma P2025: Record not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: '待審核記錄不存在' },
        { status: 404 }
      )
    }

    console.error('拒絕審核失敗:', error)
    return NextResponse.json(
      { error: '拒絕審核失敗', details: error.message },
      { status: 500 }
    )
  }
}
