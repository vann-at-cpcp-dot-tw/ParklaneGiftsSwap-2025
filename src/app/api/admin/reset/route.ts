import { NextResponse } from 'next/server'
import { prisma } from '~/lib/prisma'

export async function POST() {
  try {
    // 使用事務清空所有資料
    await prisma.$transaction(async (tx) => {
      // 1. 刪除所有提交記錄
      await tx.submission.deleteMany({})

      // 2. 刪除所有格子
      await tx.grid.deleteMany({})
    })

    return NextResponse.json({
      success: true,
      message: '成功清空所有資料',
    })
  } catch (error: any) {
    console.error('清空資料失敗:', error)
    return NextResponse.json(
      { error: '清空資料失敗', details: error.message },
      { status: 500 }
    )
  }
}
