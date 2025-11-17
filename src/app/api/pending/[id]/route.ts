import { NextResponse } from 'next/server'

import { prisma } from '~/lib/prisma'

/**
 * GET /api/pending/:id
 * iPad 輪詢用：檢查待審核記錄是否還存在
 * - pending: 還在待審核
 * - processed: 已處理（approved 或 rejected）
 */
export async function GET(
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

    const pending = await prisma.pendingSubmission.findUnique({
      where: { id },
    })

    return NextResponse.json({
      status: pending ? 'pending' : 'processed',
    })
  } catch (error: any) {
    console.error('檢查待審核狀態失敗:', error)
    return NextResponse.json(
      { error: '檢查失敗', details: error.message },
      { status: 500 }
    )
  }
}
