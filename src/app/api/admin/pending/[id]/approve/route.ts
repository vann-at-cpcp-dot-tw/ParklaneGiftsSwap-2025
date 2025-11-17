import { NextResponse } from 'next/server'

import { prisma } from '~/lib/prisma'

/**
 * POST /api/admin/pending/:id/approve
 * 審核通過：創建正式 Submission + 更新 Grid + 刪除 Pending
 */
export async function POST(
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

    // 1. 獲取 PendingSubmission
    const pending = await prisma.pendingSubmission.findUnique({
      where: { id },
      include: { grid: true },
    })

    if (!pending) {
      return NextResponse.json(
        { error: '待審核記錄不存在' },
        { status: 404 }
      )
    }

    // 2. 驗證 Grid 狀態（locked 或 available 都是正常狀態）
    if (pending.grid.status !== 'locked' && pending.grid.status !== 'available') {
      return NextResponse.json(
        { error: '格子狀態異常，無法審核通過' },
        { status: 409 }
      )
    }

    // 3. 獲取下一個參加者編號
    const lastSubmission = await prisma.submission.findFirst({
      orderBy: { participantNumber: 'desc' },
    })
    const nextParticipantNumber = (lastSubmission?.participantNumber || 0) + 1

    // 4. 獲取下一個真實參加者編號
    const lastRealSubmission = await prisma.submission.findFirst({
      where: {
        isDeleted: false,
        isInitialGift: false,  // 必须排除初始礼物
      },
      orderBy: { realParticipantNo: 'desc' },
    })
    const nextRealParticipantNo = (lastRealSubmission?.realParticipantNo || 0) + 1

    // 5. 使用 transaction 創建 Submission + 更新 Grid + 刪除 Pending
    const result = await prisma.$transaction(async (tx) => {
      // 5.1 創建正式 Submission
      const submission = await tx.submission.create({
        data: {
          participantNumber: nextParticipantNumber,
          realParticipantNo: nextRealParticipantNo,
          giftType: pending.giftType,
          message: pending.message,
          name: pending.name,
          lineId: pending.lineId,
          instagram: pending.instagram,
          assignedGridId: pending.assignedGridId,
          status: 'completed',
          completedAt: new Date(),
        },
      })

      // 5.2 更新 Grid 狀態（礼物一进一出，格子继续可用）
      await tx.grid.update({
        where: { id: pending.assignedGridId },
        data: {
          status: 'available',
          currentGiftType: pending.giftType,
          currentParticipantId: submission.id,
        },
      })

      // 5.3 刪除 PendingSubmission
      await tx.pendingSubmission.delete({
        where: { id },
      })

      return submission
    })

    return NextResponse.json({
      success: true,
      submission: {
        id: result.id,
        participantNumber: result.participantNumber,
        realParticipantNo: result.realParticipantNo,
        gridNumber: pending.grid.gridNumber,
        giftType: result.giftType,
      },
      previousSubmission: pending.previousSubmission,
    })
  } catch (error: any) {
    console.error('審核通過失敗:', error)
    return NextResponse.json(
      { error: '審核通過失敗', details: error.message },
      { status: 500 }
    )
  }
}
