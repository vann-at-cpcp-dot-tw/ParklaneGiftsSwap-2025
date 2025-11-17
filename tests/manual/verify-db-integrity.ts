import { prisma } from '../../src/lib/prisma'

async function main() {
  console.log('====================================')
  console.log('數據庫完整性驗證')
  console.log('====================================\n')

  // 1. Grid 表驗證
  const gridCount = await prisma.grid.count()
  const gridsWithWrongStatus = await prisma.grid.count({
    where: { status: { not: 'available' } },
  })

  console.log('1. Grid 表驗證：')
  console.log(`   總行數：${gridCount}`)
  if (gridCount === 30) {
    console.log('   ✅ Grid 表恰好 30 行')
  } else {
    console.log(`   ❌ Grid 表行數錯誤：預期 30，實際 ${gridCount}`)
  }

  if (gridsWithWrongStatus === 0) {
    console.log('   ✅ 所有格子狀態為 available')
  } else {
    console.log(`   ❌ 有 ${gridsWithWrongStatus} 個格子狀態不是 available`)
    const wrongGrids = await prisma.grid.findMany({
      where: { status: { not: 'available' } },
    })
    wrongGrids.forEach(g => {
      console.log(`      - Grid ${g.gridNumber}: status=${g.status}`)
    })
  }

  // 2. participantNumber 連續性驗證
  const allSubmissions = await prisma.submission.findMany({
    orderBy: { participantNumber: 'asc' },
    select: { participantNumber: true, isDeleted: true },
  })

  console.log('\n2. participantNumber 連續性驗證：')
  let hasGap = false
  for (let i = 0; i < allSubmissions.length; i++) {
    const expected = i + 1
    const actual = allSubmissions[i].participantNumber
    if (actual !== expected) {
      console.log(`   ❌ participantNumber 不連續：索引 ${i} 預期 ${expected}，實際 ${actual}`)
      hasGap = true
      break
    }
  }

  if (!hasGap) {
    console.log(`   ✅ participantNumber 連續無跳號（1-${allSubmissions.length}）`)
  }

  // 3. realParticipantNo 連續性驗證（排除初始禮物）
  const realSubmissions = await prisma.submission.findMany({
    where: { isInitialGift: false, isDeleted: false },
    orderBy: { realParticipantNo: 'asc' },
    select: { realParticipantNo: true, participantNumber: true },
  })

  console.log('\n3. realParticipantNo 連續性驗證：')
  let hasRealGap = false
  for (let i = 0; i < realSubmissions.length; i++) {
    const expected = i + 1
    const actual = realSubmissions[i].realParticipantNo
    if (actual !== expected) {
      console.log(`   ❌ realParticipantNo 不連續：索引 ${i} 預期 ${expected}，實際 ${actual}`)
      console.log(`      （對應 participantNumber = ${realSubmissions[i].participantNumber}）`)
      hasRealGap = true
      break
    }
  }

  if (!hasRealGap) {
    console.log(`   ✅ realParticipantNo 連續無跳號（1-${realSubmissions.length}）`)
  }

  // 4. 初始禮物的 realParticipantNo 驗證
  const initialGiftsWithRealNo = await prisma.submission.count({
    where: {
      isInitialGift: true,
      realParticipantNo: { not: null },
    },
  })

  console.log('\n4. 初始禮物 realParticipantNo 驗證：')
  if (initialGiftsWithRealNo === 0) {
    console.log('   ✅ 所有初始禮物的 realParticipantNo 為 null')
  } else {
    console.log(`   ❌ 有 ${initialGiftsWithRealNo} 個初始禮物的 realParticipantNo 不為 null`)
  }

  // 5. Grid currentGiftType 與 Submission 一致性驗證
  console.log('\n5. Grid currentGiftType 一致性驗證：')
  const grids = await prisma.grid.findMany({
    include: {
      submissions: {
        where: { isDeleted: false, status: 'completed' },
        orderBy: { completedAt: 'desc' },
        take: 1,
      },
    },
  })

  let hasInconsistency = false
  for (const grid of grids) {
    if (grid.submissions.length > 0) {
      const latestSubmission = grid.submissions[0]
      if (grid.currentGiftType !== latestSubmission.giftType) {
        console.log(`   ❌ Grid ${grid.gridNumber} 不一致：`)
        console.log(`      Grid.currentGiftType = ${grid.currentGiftType}`)
        console.log(`      Submission.giftType = ${latestSubmission.giftType}`)
        hasInconsistency = true
      }
    }
  }

  if (!hasInconsistency) {
    console.log('   ✅ 所有格子的 currentGiftType 與最新 Submission 一致')
  }

  console.log('\n====================================')
  console.log('驗證完成')
  console.log('====================================')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
