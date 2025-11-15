import { NextResponse } from 'next/server'

import { prisma } from '~/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { giftType, message = '', name = '', lineId = '', instagram = '', preferSameType = null, assignedGridId } = body

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

    let selectedGrid
    let matchedPreference = true

    if (assignedGridId) {
      // ⚠️ 前端已預選格子，直接使用（純前端抽選模式）
      selectedGrid = await prisma.grid.findUnique({
        where: { id: assignedGridId }
      })

      if (!selectedGrid) {
        return NextResponse.json(
          { error: '格子不存在', retryable: true },
          { status: 404 }
        )
      }

      if (selectedGrid.status !== 'available') {
        return NextResponse.json(
          { error: '格子已被佔用', retryable: true },
          { status: 409 }
        )
      }

      // 檢查是否符合偏好（用於記錄）
      if (preferSameType === true && selectedGrid.currentGiftType !== giftType) {
        matchedPreference = false
      } else if (preferSameType === false && selectedGrid.currentGiftType === giftType) {
        matchedPreference = false
      }
    } else {
      // ⚠️ 向後兼容：保留原有隨機選擇邏輯
      // 1. 根據用戶選擇構建查詢條件
      let whereCondition: any = { status: 'available' }

      if (preferSameType === true) {
        // 同頻：優先同類型
        whereCondition.currentGiftType = giftType
      } else if (preferSameType === false) {
        // 反差：避免同類型
        whereCondition.currentGiftType = { not: giftType }
      }
      // else: 隨機（preferSameType === null），不添加類型限制

      // 2. 查詢符合條件的格子
      let availableGrids = await prisma.grid.findMany({ where: whereCondition })

      // 3. 記錄是否找到符合偏好的格子
      matchedPreference = preferSameType === null ? true : availableGrids.length > 0

      // 4. 降級策略：如果沒有符合條件的，改為隨機
      if (availableGrids.length === 0) {
        availableGrids = await prisma.grid.findMany({
          where: { status: 'available' }
        })
      }

      if (availableGrids.length === 0) {
        return NextResponse.json(
          { error: '所有格子都被佔用，請稍後再試' },
          { status: 503 }
        )
      }

      // 5. 隨機選一個
      selectedGrid =
        availableGrids[Math.floor(Math.random() * availableGrids.length)]
    }

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
      // 1. 嘗試鎖定格子（樂觀鎖保護併發）
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

      // 2. 創建提交記錄（直接完成）
      const newSubmission = await tx.submission.create({
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
          status: 'completed', // 單一事務直接完成
          completedAt: new Date(), // 記錄完成時間
        },
      })

      // 3. 立即解鎖格子並更新狀態（格子可被下一個參加者使用）
      await tx.grid.update({
        where: { id: selectedGrid.id },
        data: {
          status: 'available', // 解鎖格子
          currentGiftType: newSubmission.giftType, // 更新當前禮物類型
          currentParticipantId: newSubmission.id, // 更新當前參加者 ID
        },
      })

      return newSubmission
    })

    return NextResponse.json({
      success: true,
      matchedPreference,
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
