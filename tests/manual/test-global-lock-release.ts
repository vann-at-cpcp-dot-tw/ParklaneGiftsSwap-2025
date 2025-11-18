/**
 * 測試全局鎖定自動解除功能
 *
 * 測試場景：
 * 1. 模擬 iPad A 提交審核（創建 pending）
 * 2. 模擬 iPad B 檢測到全局鎖定
 * 3. 模擬管理員審核通過 iPad A
 * 4. 驗證 iPad B 檢測到鎖定已解除
 */

const BASE_URL = 'http://localhost:3000'

// 模擬 iPad A - 提交審核
async function simulateIPadA() {
  console.log('\n=== 模擬 iPad A 提交審核 ===')

  // 1. 提交審核（創建 pending）
  const response = await fetch(`${BASE_URL}/api/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      giftType: 'A',
      message: '測試全局鎖定解除',
      name: '測試用戶A',
      assignedGridId: 181,  // gridNumber=1
      preferSameType: true,
    }),
  })

  const data = await response.json()

  if (response.ok && data.pendingId) {
    console.log(`✅ iPad A 提交成功，pendingId=${data.pendingId}`)
    return data.pendingId
  } else {
    console.log('❌ iPad A 提交失敗:', data.error)
    return null
  }
}

// 模擬 iPad B - 檢測全局鎖定
async function simulateIPadB() {
  console.log('\n=== 模擬 iPad B 檢測全局鎖定 ===')

  let lockReleased = false
  let checkCount = 0
  const maxChecks = 30  // 最多檢查 30 次（60 秒）

  while (!lockReleased && checkCount < maxChecks) {
    const response = await fetch(`${BASE_URL}/api/pending/check`)
    const data = await response.json()

    checkCount++

    if (data.hasPending) {
      console.log(`[${checkCount}] 全局鎖定中...`)
    } else {
      console.log(`[${checkCount}] ✅ 全局鎖定已解除！`)
      lockReleased = true
    }

    // 等待 2 秒再檢查（模擬前端輪詢間隔）
    if (!lockReleased && checkCount < maxChecks) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  return lockReleased
}

// 模擬管理員審核
async function simulateAdminApprove(pendingId: number) {
  console.log(`\n=== 模擬管理員審核通過 pendingId=${pendingId} ===`)

  const response = await fetch(`${BASE_URL}/api/admin/pending/${pendingId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (response.ok) {
    console.log('✅ 管理員審核通過')
    return true
  } else {
    console.log('❌ 審核失敗')
    return false
  }
}

// 主測試流程
async function runTest() {
  console.log('====================================')
  console.log('測試全局鎖定自動解除功能')
  console.log('====================================')

  try {
    // 1. 先檢查初始狀態
    console.log('\n=== 初始狀態檢查 ===')
    const initialCheck = await fetch(`${BASE_URL}/api/pending/check`)
    const initialData = await initialCheck.json()
    console.log('初始狀態：hasPending =', initialData.hasPending)

    if (initialData.hasPending) {
      console.log('⚠️  已有待審核記錄，請先清空數據庫')
      return
    }

    // 2. iPad A 提交審核
    const pendingId = await simulateIPadA()
    if (!pendingId) {
      console.log('測試終止：無法創建 pending')
      return
    }

    // 3. 檢查全局鎖定是否生效
    console.log('\n=== 驗證全局鎖定已生效 ===')
    const lockCheck = await fetch(`${BASE_URL}/api/pending/check`)
    const lockData = await lockCheck.json()
    console.log('全局鎖定狀態：hasPending =', lockData.hasPending)

    if (!lockData.hasPending) {
      console.log('❌ 錯誤：全局鎖定未生效')
      return
    }

    // 4. 同時啟動 iPad B 監控和管理員審核
    console.log('\n=== 開始併發測試 ===')
    console.log('iPad B 開始監控全局鎖定狀態...')
    console.log('5 秒後管理員將審核通過...')

    // iPad B 開始監控（在背景運行）
    const iPadBPromise = simulateIPadB()

    // 等待 5 秒後，管理員審核
    await new Promise(resolve => setTimeout(resolve, 5000))
    await simulateAdminApprove(pendingId)

    // 等待 iPad B 的監控結果
    const lockReleased = await iPadBPromise

    // 5. 驗證結果
    console.log('\n====================================')
    console.log('測試結果')
    console.log('====================================')

    if (lockReleased) {
      console.log('✅ 測試通過：全局鎖定成功自動解除')
      console.log('   - iPad A 提交審核 → 全局鎖定生效')
      console.log('   - 管理員審核通過 → 全局鎖定解除')
      console.log('   - iPad B 自動檢測到解除')
    } else {
      console.log('❌ 測試失敗：全局鎖定未自動解除')
    }

    // 6. 最終狀態檢查
    console.log('\n=== 最終狀態檢查 ===')
    const finalCheck = await fetch(`${BASE_URL}/api/pending/check`)
    const finalData = await finalCheck.json()
    console.log('最終狀態：hasPending =', finalData.hasPending)

    // 查詢數據庫驗證
    console.log('\n=== 數據庫狀態 ===')
    console.log('請查詢數據庫確認：')
    console.log('- PendingSubmission 表應該為空')
    console.log('- Grid #1 (id=121) 狀態應該為 available')
    console.log('- Submission 表應該有新增一筆記錄')

  } catch (error) {
    console.error('測試過程中發生錯誤:', error)
  }
}

// 執行測試
runTest()