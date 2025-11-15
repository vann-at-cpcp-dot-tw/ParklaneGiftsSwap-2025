import { NextResponse } from 'next/server'

import { prisma } from '~/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const giftType = searchParams.get('giftType')
    const preferSameTypeParam = searchParams.get('preferSameType')
    const excludeLastParam = searchParams.get('excludeLast')

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

    // 解析 excludeLast 參數（預設 1，可設為 0 關閉排除機制）
    const excludeLast = excludeLastParam ? parseInt(excludeLastParam, 10) : 1

    // 驗證 excludeLast 範圍
    if (isNaN(excludeLast) || excludeLast < 0 || excludeLast > 30) {
      return NextResponse.json(
        { error: 'excludeLast 必須在 0-30 之間' },
        { status: 400 }
      )
    }

    // 0. 查詢倒數 X 個被抽中的格子（用於防止短期內重複抽到）
    const recentSubmissions = excludeLast > 0
      ? await prisma.submission.findMany({
        where: {
          status: 'completed',
          isDeleted: false
        },
        orderBy: { completedAt: 'desc' },
        take: excludeLast,
        select: { assignedGridId: true }
      })
      : []

    const excludedGridIds = recentSubmissions.map(s => s.assignedGridId)

    // 1. 根據用戶選擇構建查詢條件（加入排除倒數 X 個格子）
    let whereCondition: any = {
      status: 'available',
      // 排除倒數 X 個被抽中的格子（如果有的話）
      ...(excludedGridIds.length > 0 ? { id: { notIn: excludedGridIds } } : {})
    }

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

    // 4. 智能降級策略（三層）
    // 第一層降級：如果沒有符合「類型偏好 + 排除倒數 X 個」，改為「只排除倒數 X 個（不管類型）」
    if (availableGrids.length === 0) {
      availableGrids = await prisma.grid.findMany({
        where: {
          status: 'available',
          ...(excludedGridIds.length > 0 ? { id: { notIn: excludedGridIds } } : {})
        }
      })
    }

    // 第二層降級：如果還是沒有，逐步減少排除數量（從 excludeLast-1 降到 0）
    let currentExcludeLast = excludeLast - 1
    while (availableGrids.length === 0 && currentExcludeLast >= 0) {
      // ✅ 優化：使用已查詢的 recentSubmissions，在內存中 slice（不再重複查詢資料庫）
      const reducedExcludedGridIds = recentSubmissions
        .slice(0, currentExcludeLast)
        .map(s => s.assignedGridId)

      availableGrids = await prisma.grid.findMany({
        where: {
          status: 'available',
          ...(reducedExcludedGridIds.length > 0 ? { id: { notIn: reducedExcludedGridIds } } : {})
        }
      })

      currentExcludeLast--
    }

    // 第三層降級：如果還是沒有（所有格子都被佔用），返回錯誤
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
            isDeleted: false, // 排除軟刪除的記錄
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
