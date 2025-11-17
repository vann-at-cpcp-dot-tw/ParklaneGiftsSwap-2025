import { NextResponse } from 'next/server'

import { prisma, Prisma } from '~/lib/prisma'

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
        isDeleted: false, // 排除軟刪除的記錄
      },
      orderBy: { completedAt: 'desc' },
    })

    // 5. 取得下一個參加者編號
    const lastSubmission = await prisma.submission.findFirst({
      orderBy: { participantNumber: 'desc' },
    })
    const nextParticipantNumber = (lastSubmission?.participantNumber || 0) + 1

    // 6. 創建待審核記錄並鎖定格子（使用 transaction 確保原子性）
    const pendingSubmission = await prisma.$transaction(async (tx) => {
      // 再次檢查格子狀態（防止並發衝突）
      const grid = await tx.grid.findUnique({
        where: { id: selectedGrid.id },
      })

      if (!grid || grid.status !== 'available') {
        throw new Error('格子已被佔用，請重試')
      }

      // 鎖定格子
      await tx.grid.update({
        where: { id: selectedGrid.id },
        data: { status: 'locked' },
      })

      // 創建 PendingSubmission
      return await tx.pendingSubmission.create({
        data: {
          giftType,
          message,
          name,
          lineId: lineId || null,
          instagram: instagram || null,
          assignedGridId: selectedGrid.id,
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
            : Prisma.DbNull,
          matchedPreference,
        },
      })
    })

    return NextResponse.json({
      success: true,
      matchedPreference,
      pendingId: pendingSubmission.id,
      submission: {
        assignedGridId: pendingSubmission.assignedGridId,
        gridNumber: selectedGrid.gridNumber,
        giftType: pendingSubmission.giftType,
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
