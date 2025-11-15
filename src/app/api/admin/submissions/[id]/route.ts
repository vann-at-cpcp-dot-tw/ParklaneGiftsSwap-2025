import type { PrismaClient } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

import { prisma } from '~/lib/prisma'

// Prisma Transaction 類型
type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

/**
 * 重建指定 Grid 的狀態
 * 根據該 Grid 最新的 completed submission 更新 currentGiftType 和 currentParticipantId
 */
async function rebuildGridState(tx: PrismaTransaction, gridId: number) {
  // 查詢該 Grid 的最新 completed submission（排除軟刪除）
  const latestSubmission = await tx.submission.findFirst({
    where: {
      assignedGridId: gridId,
      status: 'completed',
      isDeleted: false // 排除軟刪除的記錄
    },
    orderBy: { completedAt: 'desc' }
  })

  // 更新 Grid 狀態
  await tx.grid.update({
    where: { id: gridId },
    data: {
      currentGiftType: latestSubmission?.giftType || null,
      currentParticipantId: latestSubmission?.id || null
    }
  })
}

/**
 * 編輯提交記錄（Admin）
 * PATCH /api/admin/submissions/[id]
 *
 * Request body:
 * - giftType?: 'A' | 'B' | 'C'
 * - message?: string (限制 20 字)
 * - name?: string
 * - lineId?: string
 * - instagram?: string
 *
 * 注意：assignedGridId 不可修改（避免歷史錯亂）
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const submissionId = parseInt(id, 10)

    if (isNaN(submissionId)) {
      return NextResponse.json(
        { error: '無效的提交 ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { giftType, message, name, lineId, instagram } = body

    // 驗證欄位
    if (giftType && !['A', 'B', 'C'].includes(giftType)) {
      return NextResponse.json(
        { error: '無效的禮物類型' },
        { status: 400 }
      )
    }

    if (message && message.length > 20) {
      return NextResponse.json(
        { error: '留言不得超過 20 字' },
        { status: 400 }
      )
    }

    // assignedGridId 不允許修改，即使前端傳入也忽略

    // 使用 transaction 更新記錄並重建 Grid 狀態
    const result = await prisma.$transaction(async (tx) => {
      // 1. 獲取舊記錄（判斷是否需要重建 Grid）
      const oldSubmission = await tx.submission.findUnique({
        where: { id: submissionId }
      })

      if (!oldSubmission) {
        throw new Error('找不到提交記錄')
      }

      // 2. 準備更新資料（不包含 assignedGridId）
      const updateData: any = {}
      if (giftType !== undefined) updateData.giftType = giftType
      if (message !== undefined) updateData.message = message
      if (name !== undefined) updateData.name = name
      if (lineId !== undefined) updateData.lineId = lineId || null
      if (instagram !== undefined) updateData.instagram = instagram || null

      // 3. 更新記錄
      const updatedSubmission = await tx.submission.update({
        where: { id: submissionId },
        data: updateData
      })

      // 4. 重建當前 Grid 狀態（只需重建一個格子，因為 assignedGridId 不可改）
      await rebuildGridState(tx, updatedSubmission.assignedGridId)

      return {
        submission: updatedSubmission,
        affectedGridId: updatedSubmission.assignedGridId
      }
    })

    return NextResponse.json({
      success: true,
      message: '記錄已更新',
      submission: result.submission,
      affectedGridId: result.affectedGridId
    })
  } catch (error: any) {
    console.error('更新提交記錄失敗:', error)

    if (error.message === '找不到提交記錄') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: '更新提交記錄失敗', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * 軟刪除提交記錄（Admin）
 * DELETE /api/admin/submissions/[id]
 *
 * 標記為已刪除（isDeleted=true），編號會自動跳號
 * 刪除後自動重建相關 Grid 的狀態
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const submissionId = parseInt(id, 10)

    if (isNaN(submissionId)) {
      return NextResponse.json(
        { error: '無效的提交 ID' },
        { status: 400 }
      )
    }

    // 使用 transaction 軟刪除記錄並重建 Grid 狀態
    const result = await prisma.$transaction(async (tx) => {
      // 1. 獲取要刪除的記錄
      const submission = await tx.submission.findUnique({
        where: { id: submissionId }
      })

      if (!submission) {
        throw new Error('找不到提交記錄')
      }

      if (submission.isDeleted) {
        throw new Error('此記錄已經被刪除')
      }

      const affectedGridId = submission.assignedGridId

      // 2. 軟刪除記錄（標記為已刪除，而非真正刪除）
      const deletedSubmission = await tx.submission.update({
        where: { id: submissionId },
        data: {
          isDeleted: true,
          deletedAt: new Date()
        }
      })

      // 3. 重建相關 Grid 狀態（會自動找到「上一筆未刪除」的記錄）
      await rebuildGridState(tx, affectedGridId)

      return {
        deletedSubmission,
        affectedGridId
      }
    })

    return NextResponse.json({
      success: true,
      message: '記錄已刪除',
      deletedSubmission: result.deletedSubmission,
      affectedGridId: result.affectedGridId
    })
  } catch (error: any) {
    console.error('刪除提交記錄失敗:', error)

    if (error.message === '找不到提交記錄') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: '刪除提交記錄失敗', details: error.message },
      { status: 500 }
    )
  }
}
