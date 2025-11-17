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

    // 直接硬刪除 PendingSubmission
    const deleted = await prisma.pendingSubmission.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      deletedId: deleted.id,
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
