import { NextResponse } from 'next/server'

import { prisma } from '~/lib/prisma'

/**
 * 查詢指定提交記錄的「上一個參加者」資料
 * GET /api/admin/submissions/[id]/previous
 *
 * 用途：admin/log 頁面補列印功能
 *
 * 回傳：previousSubmission（若為初始禮物或查無資料則為 null）
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const submissionId = parseInt(id, 10)

    if (isNaN(submissionId)) {
      return NextResponse.json(
        { error: '無效的提交 ID' },
        { status: 400 }
      )
    }

    // 1. 獲取當前提交記錄
    const currentSubmission = await prisma.submission.findUnique({
      where: { id: submissionId }
    })

    if (!currentSubmission) {
      return NextResponse.json(
        { error: '找不到提交記錄' },
        { status: 404 }
      )
    }

    // 2. 若為初始禮物，直接回傳 null
    if (currentSubmission.isInitialGift) {
      return NextResponse.json({
        success: true,
        previousSubmission: null,
        isInitialGift: true
      })
    }

    // 3. 查詢「上一個參加者」（同一格子、比當前記錄更早完成、未刪除）
    const previousSubmission = await prisma.submission.findFirst({
      where: {
        assignedGridId: currentSubmission.assignedGridId,
        status: 'completed',
        isDeleted: false,
        completedAt: {
          lt: currentSubmission.completedAt // 比當前記錄更早完成
        }
      },
      orderBy: { completedAt: 'desc' } // 最新的完成記錄
    })

    return NextResponse.json({
      success: true,
      previousSubmission: previousSubmission
        ? {
          participantNumber: previousSubmission.participantNumber,
          realParticipantNo: previousSubmission.realParticipantNo,
          giftType: previousSubmission.giftType,
          message: previousSubmission.message,
          name: previousSubmission.name,
          lineId: previousSubmission.lineId,
          instagram: previousSubmission.instagram,
        }
        : null,
      isInitialGift: false
    })
  } catch (error: any) {
    console.error('查詢上一個參加者失敗:', error)

    return NextResponse.json(
      { error: '查詢失敗', details: error.message },
      { status: 500 }
    )
  }
}
