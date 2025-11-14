import { NextResponse } from 'next/server'
import { prisma } from '~/lib/prisma'

// 初始化 30 個格子（一次性執行）
export async function POST() {
  try {
    // 檢查是否已經初始化
    const existingGrids = await prisma.grid.count()

    if (existingGrids > 0) {
      return NextResponse.json(
        { message: '格子已經初始化過了', count: existingGrids },
        { status: 400 }
      )
    }

    // 創建 30 個格子
    const grids = []
    for (let i = 1; i <= 30; i++) {
      grids.push({
        gridNumber: i,
        currentGiftType: 'default', // 初始禮物類型
        status: 'available',
      })
    }

    await prisma.grid.createMany({
      data: grids,
    })

    return NextResponse.json({
      success: true,
      message: '成功初始化 30 個格子',
      count: 30,
    })
  } catch (error) {
    console.error('初始化格子失敗:', error)
    return NextResponse.json(
      { error: '初始化失敗', details: error },
      { status: 500 }
    )
  }
}
