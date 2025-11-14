import { NextResponse } from 'next/server'
import { prisma } from '~/lib/prisma'

interface GiftData {
  giftType: 'A' | 'B' | 'C'
  message: string
  name: string
  lineId?: string
  instagram?: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { gifts }: { gifts: GiftData[] } = body

    // 驗證資料
    if (!Array.isArray(gifts) || gifts.length !== 30) {
      return NextResponse.json(
        { error: '必須提供正好 30 筆禮物資料' },
        { status: 400 }
      )
    }

    // 驗證每筆資料
    for (let i = 0; i < gifts.length; i++) {
      const gift = gifts[i]
      if (!gift.giftType || !['A', 'B', 'C'].includes(gift.giftType)) {
        return NextResponse.json(
          { error: `第 ${i + 1} 筆資料的類型無效` },
          { status: 400 }
        )
      }
      if (!gift.name || gift.name.trim() === '') {
        return NextResponse.json(
          { error: `第 ${i + 1} 筆資料缺少姓名` },
          { status: 400 }
        )
      }
    }

    // 檢查是否已經有資料
    const existingGrids = await prisma.grid.count()
    const existingSubmissions = await prisma.submission.count()

    if (existingGrids > 0 || existingSubmissions > 0) {
      return NextResponse.json(
        {
          error: '資料庫中已有資料，請先清空',
          grids: existingGrids,
          submissions: existingSubmissions,
        },
        { status: 400 }
      )
    }

    // 使用事務創建格子和禮物
    const result = await prisma.$transaction(async (tx) => {
      // 1. 創建 30 個格子
      const grids = []
      for (let i = 1; i <= 30; i++) {
        const grid = await tx.grid.create({
          data: {
            gridNumber: i,
            currentGiftType: 'default',
            status: 'available',
          },
        })
        grids.push(grid)
      }

      // 2. 為每個格子創建初始禮物記錄
      const submissions = []
      for (let i = 0; i < 30; i++) {
        const gift = gifts[i]
        const submission = await tx.submission.create({
          data: {
            participantNumber: i + 1,
            isInitialGift: true, // 標記為預設禮物
            realParticipantNo: null, // 預設禮物沒有真實參加者編號
            giftType: gift.giftType,
            message: gift.message || '',
            name: gift.name,
            lineId: gift.lineId || null,
            instagram: gift.instagram || null,
            assignedGridId: grids[i].id,
            status: 'completed', // 初始禮物直接設為完成
            completedAt: new Date(),
            expiresAt: new Date(), // 不會過期
          },
        })
        submissions.push(submission)

        // 3. 更新格子狀態
        await tx.grid.update({
          where: { id: grids[i].id },
          data: {
            currentGiftType: gift.giftType,
            currentParticipantId: submission.id,
            status: 'available',
          },
        })
      }

      return { grids, submissions }
    })

    return NextResponse.json({
      success: true,
      message: '成功初始化 30 個格子和初始禮物',
      data: {
        gridsCount: result.grids.length,
        submissionsCount: result.submissions.length,
      },
    })
  } catch (error: any) {
    console.error('手動初始化失敗:', error)
    return NextResponse.json(
      { error: '初始化失敗', details: error.message },
      { status: 500 }
    )
  }
}
