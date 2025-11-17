import { NextResponse } from 'next/server'

import { prisma } from '~/lib/prisma'

/**
 * 獲取提交記錄列表（Admin）
 * GET /api/admin/submissions
 *
 * Query 參數：
 * - page: 頁碼（default: 1）
 * - pageSize: 每頁筆數（default: 50）
 * - search: 搜尋關鍵字（姓名或參加者編號）
 * - sortBy: 排序欄位（default: 'realParticipantNo'）
 * - sortOrder: 排序方向（'asc' | 'desc', default: 'desc'）
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // 分頁參數
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10)

    // 搜尋參數
    const search = searchParams.get('search') || ''

    // 排序參數
    const sortBy = searchParams.get('sortBy') || 'realParticipantNo'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    // 驗證分頁參數
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: '無效的分頁參數' },
        { status: 400 }
      )
    }

    // 構建搜尋條件
    const searchNumber = parseInt(search, 10)
    const where: any = {
      isDeleted: false, // 只顯示未刪除的記錄
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          ...(isNaN(searchNumber) ? [] : [
            { realParticipantNo: searchNumber },
            { participantNumber: searchNumber }  // 恢復全局編號搜尋（用於找初始禮物）
          ])
        ]
      } : {})
    }

    // 查詢總筆數
    const total = await prisma.submission.count({ where })

    // 計算總頁數
    const totalPages = Math.ceil(total / pageSize)

    // 查詢分頁資料（JOIN grid 獲取 gridNumber）
    const submissions = await prisma.submission.findMany({
      where,
      include: {
        grid: {
          select: {
            gridNumber: true
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return NextResponse.json({
      success: true,
      data: submissions,
      pagination: {
        total,
        page,
        pageSize,
        totalPages
      }
    })
  } catch (error: any) {
    console.error('獲取提交記錄失敗:', error)
    return NextResponse.json(
      { error: '獲取提交記錄失敗', details: error.message },
      { status: 500 }
    )
  }
}
