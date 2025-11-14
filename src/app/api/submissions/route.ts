import { NextResponse } from 'next/server'
import { prisma } from '~/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { giftType, message = '', name = '', lineId = '', instagram = '' } = body

    if (!giftType || !['A', 'B', 'C'].includes(giftType)) {
      return NextResponse.json(
        { error: '無效的禮物類型' },
        { status: 400 }
      )
    }

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: '請填寫姓名' },
        { status: 400 }
      )
    }

    // 1. 找可用格子（優先同類型）
    let availableGrids = await prisma.grid.findMany({
      where: {
        status: 'available',
        currentGiftType: giftType,
      },
    })

    // 2. 如果同類型沒有，降級為隨機
    if (availableGrids.length === 0) {
      availableGrids = await prisma.grid.findMany({
        where: { status: 'available' },
      })
    }

    if (availableGrids.length === 0) {
      return NextResponse.json(
        { error: '所有格子都被佔用，請稍後再試' },
        { status: 503 }
      )
    }

    // 3. 隨機選一個
    const selectedGrid =
      availableGrids[Math.floor(Math.random() * availableGrids.length)]

    // 4. 取得「上一個」參加者的資料（用於列印）
    const previousSubmission = await prisma.submission.findFirst({
      where: {
        assignedGridId: selectedGrid.id,
        status: 'completed',
      },
      orderBy: { completedAt: 'desc' },
    })

    // 5. 取得下一個參加者編號
    const lastSubmission = await prisma.submission.findFirst({
      orderBy: { participantNumber: 'desc' },
    })
    const nextParticipantNumber = (lastSubmission?.participantNumber || 0) + 1

    // 5.5 取得下一個真實參加者編號（不包含預設禮物）
    const lastRealParticipant = await prisma.submission.findFirst({
      where: { isInitialGift: false },
      orderBy: { realParticipantNo: 'desc' },
    })
    const nextRealParticipantNo = (lastRealParticipant?.realParticipantNo || 0) + 1

    // 6. 鎖定並創建提交記錄（事務保證原子性）
    const submission = await prisma.$transaction(async (tx) => {
      // 嘗試鎖定格子（樂觀鎖）
      const lockedGrid = await tx.grid.updateMany({
        where: {
          id: selectedGrid.id,
          status: 'available', // 只有 available 才能鎖
        },
        data: { status: 'locked' },
      })

      if (lockedGrid.count === 0) {
        throw new Error('格子已被佔用，請重試')
      }

      // 創建提交記錄
      return tx.submission.create({
        data: {
          participantNumber: nextParticipantNumber,
          isInitialGift: false, // 真實參加者
          realParticipantNo: nextRealParticipantNo, // 真實參加者編號（1, 2, 3...）
          giftType,
          message,
          name,
          lineId: lineId || null,
          instagram: instagram || null,
          assignedGridId: selectedGrid.id,
          status: 'pending',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 分鐘後過期
        },
      })
    })

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        participantNumber: submission.participantNumber,
        giftType: submission.giftType,
        assignedGridId: submission.assignedGridId,
        gridNumber: selectedGrid.gridNumber,
      },
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
    })
  } catch (error: any) {
    console.error('創建參加記錄失敗:', error)

    if (error.message === '格子已被佔用，請重試') {
      return NextResponse.json(
        { error: error.message, retryable: true },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: '創建參加記錄失敗', details: error.message },
      { status: 500 }
    )
  }
}
