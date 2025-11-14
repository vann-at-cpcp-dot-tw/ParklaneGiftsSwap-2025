import { NextResponse } from 'next/server'
import { prisma } from '~/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const submissionId = parseInt(params.id, 10)

    if (isNaN(submissionId)) {
      return NextResponse.json(
        { error: '無效的提交 ID' },
        { status: 400 }
      )
    }

    // 使用事務完成交換
    const result = await prisma.$transaction(async (tx) => {
      // 1. 查詢提交記錄
      const submission = await tx.submission.findUnique({
        where: { id: submissionId },
        include: { grid: true },
      })

      if (!submission) {
        throw new Error('找不到提交記錄')
      }

      if (submission.status === 'completed') {
        throw new Error('此記錄已經完成交換')
      }

      // 2. 更新提交狀態
      const updatedSubmission = await tx.submission.update({
        where: { id: submissionId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      })

      // 3. 更新格子狀態
      await tx.grid.update({
        where: { id: submission.assignedGridId },
        data: {
          status: 'available',
          currentGiftType: submission.giftType,
          currentParticipantId: submissionId,
        },
      })

      return updatedSubmission
    })

    return NextResponse.json({
      success: true,
      message: '交換完成',
      submission: result,
    })
  } catch (error: any) {
    console.error('完成交換失敗:', error)
    return NextResponse.json(
      { error: '完成交換失敗', details: error.message },
      { status: 500 }
    )
  }
}
