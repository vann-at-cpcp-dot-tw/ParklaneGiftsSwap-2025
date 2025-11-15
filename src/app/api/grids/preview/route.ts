import { NextResponse } from 'next/server'

import { prisma } from '~/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const giftType = searchParams.get('giftType')
    const preferSameTypeParam = searchParams.get('preferSameType')

    if (!giftType || !['A', 'B', 'C'].includes(giftType)) {
      return NextResponse.json(
        { error: '無效的禮物類型' },
        { status: 400 }
      )
    }

    // 解析 preferSameType 參數（'true' | 'false' | 'null'）
    const preferSameType =
      preferSameTypeParam === 'true' ? true :
        preferSameTypeParam === 'false' ? false :
          null

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
    const matchedPreference = preferSameType === null ? true : availableGrids.length > 0

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

    // 5. 對每個格子查詢「上一個」參加者的資料
    const gridsWithPreviousSubmission = await Promise.all(
      availableGrids.map(async (grid) => {
        const previousSubmission = await prisma.submission.findFirst({
          where: {
            assignedGridId: grid.id,
            status: 'completed',
          },
          orderBy: { completedAt: 'desc' },
        })

        return {
          id: grid.id,
          gridNumber: grid.gridNumber,
          currentGiftType: grid.currentGiftType,
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
        }
      })
    )

    return NextResponse.json({
      success: true,
      matchedPreference,
      availableGrids: gridsWithPreviousSubmission,
    })
  } catch (error: any) {
    console.error('查詢可用格子失敗:', error)

    return NextResponse.json(
      { error: '查詢可用格子失敗', details: error.message },
      { status: 500 }
    )
  }
}
