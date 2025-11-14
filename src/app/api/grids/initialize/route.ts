import { NextResponse } from 'next/server'
import { prisma } from '~/lib/prisma'

interface GiftData {
  giftType: 'A' | 'B' | 'C'
  message: string
  name: string
  lineId?: string
  instagram?: string
}

// 隨機生成測試資料
function generateRandomData(index: number): GiftData {
  const types: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C']
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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { mode, gifts }: { mode: 'random' | 'manual'; gifts?: GiftData[] } = body

    // 驗證模式
    if (!mode || !['random', 'manual'].includes(mode)) {
      return NextResponse.json(
        { error: '無效的初始化模式，必須是 random 或 manual' },
        { status: 400 }
      )
    }

    // 如果是手動模式，驗證資料
    if (mode === 'manual') {
      if (!Array.isArray(gifts) || gifts.length !== 30) {
        return NextResponse.json(
          { error: '手動模式必須提供正好 30 筆禮物資料' },
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

    // 準備禮物資料
    const giftDataList: GiftData[] =
      mode === 'manual' ? gifts! : Array.from({ length: 30 }, (_, i) => generateRandomData(i + 1))

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
        const gift = giftDataList[i]
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
      message: `成功初始化 30 個格子和初始禮物（${mode} 模式）`,
      data: {
        mode,
        gridsCount: result.grids.length,
        submissionsCount: result.submissions.length,
      },
    })
  } catch (error: any) {
    console.error('初始化失敗:', error)
    return NextResponse.json(
      { error: '初始化失敗', details: error.message },
      { status: 500 }
    )
  }
}
