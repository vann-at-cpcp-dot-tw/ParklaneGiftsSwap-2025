import { NextResponse } from 'next/server'
import { prisma } from '~/lib/prisma'

// 隨機生成測試資料
function generateRandomData(index: number) {
  const types = ['A', 'B', 'C']
  const messages = [
    '希望你會喜歡這份禮物',
    '祝你有個美好的一天',
    '這是精心挑選的禮物',
    '期待你的驚喜表情',
    '用心準備給你',
    '希望能帶來歡樂',
    '這個很特別喔',
    '祝你聖誕快樂',
    '新年快樂',
    '送給最棒的你',
  ]

  const giftType = types[Math.floor(Math.random() * types.length)]
  const message = messages[Math.floor(Math.random() * messages.length)]

  return {
    giftType,
    message,
    name: `測試用戶${index}`,
    lineId: `line_user_${index}`,
    instagram: `ig_user_${index}`,
  }
}

export async function POST() {
  try {
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

    // 使用事務創建 30 個格子和初始禮物
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
        const data = generateRandomData(i + 1)
        const submission = await tx.submission.create({
          data: {
            participantNumber: i + 1,
            isInitialGift: true, // 標記為預設禮物
            realParticipantNo: null, // 預設禮物沒有真實參加者編號
            giftType: data.giftType,
            message: data.message,
            name: data.name,
            lineId: data.lineId,
            instagram: data.instagram,
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
            currentGiftType: data.giftType,
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
    console.error('隨機初始化失敗:', error)
    return NextResponse.json(
      { error: '初始化失敗', details: error.message },
      { status: 500 }
    )
  }
}
