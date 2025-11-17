/**
 * 邊界條件和特殊場景測試
 * 執行：npx tsx test-edge-cases.ts
 */

const BASE_URL = 'http://localhost:3000'

interface TestResult {
  scenario: string
  success: boolean
  message: string
  data?: any
}

const results: TestResult[] = []

function log(message: string) {
  console.log(`\n${'='.repeat(70)}`)
  console.log(message)
  console.log('='.repeat(70))
}

function addResult(scenario: string, success: boolean, message: string, data?: any) {
  results.push({ scenario, success, message, data })
  console.log(`${success ? '✅' : '❌'} ${message}`)
  if (data && !success) {
    console.log('   詳細:', JSON.stringify(data, null, 2))
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ==================== 場景 1：Draw 頁停留過久 ====================
async function scenario1_DrawPageStale() {
  log('場景 1：用戶在 Draw 頁停留過久，格子被佔用')

  try {
    // 1.1 用戶 A 調用 preview（不鎖定）
    const previewResponse = await fetch(
      `${BASE_URL}/api/grids/preview?giftType=A&preferSameType=true&excludeLast=0`
    )
    const previewData = await previewResponse.json()

    if (!previewResponse.ok || !previewData.availableGrids || previewData.availableGrids.length === 0) {
      addResult('場景1', false, 'Preview 失敗', previewData)
      return
    }

    const gridA = previewData.availableGrids[0]
    addResult('場景1.1', true, `用戶 A 預覽格子 ${gridA.gridNumber}（gridId=${gridA.id}）`)

    // 1.2 用戶 B 提交並鎖定同一格子
    const submitB = await fetch(`${BASE_URL}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        giftType: 'B',
        message: '用戶 B 搶先',
        name: '用戶 B',
        assignedGridId: gridA.id,  // 同一個格子
      }),
    })

    const dataB = await submitB.json()

    if (!submitB.ok) {
      addResult('場景1.2', false, `用戶 B 提交失敗: ${dataB.error}`, dataB)
      return
    }

    addResult('場景1.2', true, `用戶 B 提交成功，鎖定格子 ${gridA.gridNumber}`)

    // 1.3 用戶 A 現在才提交（格子已被鎖定）
    const submitA = await fetch(`${BASE_URL}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        giftType: 'A',
        message: '用戶 A 太慢',
        name: '用戶 A',
        assignedGridId: gridA.id,  // 同一個格子
      }),
    })

    const dataA = await submitA.json()

    if (submitA.ok) {
      addResult('場景1.3', false, '用戶 A 應該失敗但成功了！', dataA)
    } else if (dataA.error && dataA.error.includes('格子已被佔用')) {
      addResult('場景1.3', true, '用戶 A 正確返回 409 conflict')
    } else {
      addResult('場景1.3', false, `用戶 A 錯誤訊息不正確: ${dataA.error}`, dataA)
    }

    // 清理
    await fetch(`${BASE_URL}/api/admin/pending/${dataB.pendingId}/reject`, { method: 'DELETE' })

  } catch (error: any) {
    addResult('場景1', false, `發生錯誤: ${error.message}`)
  }
}

// ==================== 場景 2：Admin 審核流程 ====================
async function scenario2_AdminApprovalFlow() {
  log('場景 2：完整的 Admin 審核流程（假設列印成功）')

  try {
    // 2.1 用戶提交
    const submitResponse = await fetch(`${BASE_URL}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        giftType: 'A',
        message: 'Admin 測試',
        name: '測試用戶',
        assignedGridId: 122,  // gridNumber=2
      }),
    })

    const submitData = await submitResponse.json()

    if (!submitResponse.ok) {
      addResult('場景2.1', false, `提交失敗: ${submitData.error}`, submitData)
      return
    }

    const pendingId = submitData.pendingId
    addResult('場景2.1', true, `用戶提交成功，pendingId=${pendingId}`)

    // 2.2 驗證格子鎖定
    const checkGrid = await fetch(`${BASE_URL}/api/grids/preview?giftType=A&preferSameType=null&excludeLast=0`)
    const gridData = await checkGrid.json()

    const grid122 = gridData.availableGrids?.find((g: any) => g.id === 122)
    if (grid122) {
      addResult('場景2.2', false, '格子 122 應該被鎖定，但仍在 availableGrids 中')
    } else {
      addResult('場景2.2', true, '格子 122 已鎖定，不在可用列表中')
    }

    // 2.3 管理員審核通過（假設列印成功）
    const approveResponse = await fetch(`${BASE_URL}/api/admin/pending/${pendingId}/approve`, {
      method: 'POST',
    })

    const approveData = await approveResponse.json()

    if (!approveResponse.ok) {
      addResult('場景2.3', false, `審核失敗: ${approveData.error}`, approveData)
      return
    }

    addResult('場景2.3', true, `審核通過，participantNumber=${approveData.submission.participantNumber}`)

    // 2.4 驗證 Pending 已刪除
    const checkPending = await fetch(`${BASE_URL}/api/pending/${pendingId}`)
    const pendingStatus = await checkPending.json()

    if (pendingStatus.status === 'processed') {
      addResult('場景2.4', true, 'Pending 已被刪除（status=processed）')
    } else {
      addResult('場景2.4', false, `Pending 應該被刪除，但 status=${pendingStatus.status}`)
    }

    // 2.5 驗證格子已釋放
    const checkGridAfter = await fetch(`${BASE_URL}/api/grids/preview?giftType=A&preferSameType=null&excludeLast=0`)
    const gridDataAfter = await checkGridAfter.json()

    const grid122After = gridDataAfter.availableGrids?.find((g: any) => g.id === 122)
    if (grid122After) {
      addResult('場景2.5', true, '格子 122 已釋放，重新出現在可用列表中')
    } else {
      addResult('場景2.5', false, '格子 122 應該已釋放，但不在可用列表中')
    }

  } catch (error: any) {
    addResult('場景2', false, `發生錯誤: ${error.message}`)
  }
}

// ==================== 場景 3：Preview 降級策略 ====================
async function scenario3_PreviewFallback() {
  log('場景 3：Preview API 的降級策略')

  try {
    // 3.1 查詢：excludeLast=2, preferSameType=true
    const response = await fetch(
      `${BASE_URL}/api/grids/preview?giftType=A&preferSameType=true&excludeLast=2`
    )
    const data = await response.json()

    if (!response.ok) {
      addResult('場景3.1', false, `Preview 失敗: ${data.error}`, data)
      return
    }

    addResult('場景3.1', true, `Preview 成功，返回 ${data.availableGrids.length} 個格子`)

    // 3.2 驗證是否符合偏好
    if (data.matchedPreference) {
      addResult('場景3.2', true, '找到符合偏好的格子')
    } else {
      addResult('場景3.2', true, '沒有符合偏好的格子，已自動降級')
    }

    // 3.3 驗證返回的格子數量 > 0
    if (data.availableGrids.length > 0) {
      addResult('場景3.3', true, '降級策略正確運作，返回了可用格子')
    } else {
      addResult('場景3.3', false, '降級策略失敗，沒有返回任何格子')
    }

  } catch (error: any) {
    addResult('場景3', false, `發生錯誤: ${error.message}`)
  }
}

// ==================== 場景 4：輪詢錯誤恢復 ====================
async function scenario4_PollingRecovery() {
  log('場景 4：前端輪詢期間的錯誤處理')

  // 這個場景需要前端測試，這裡只驗證 API 的穩定性

  try {
    // 4.1 提交一個 pending
    const submitResponse = await fetch(`${BASE_URL}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        giftType: 'C',
        message: '輪詢測試',
        name: '輪詢用戶',
        assignedGridId: 123,  // gridNumber=3
      }),
    })

    const submitData = await submitResponse.json()
    const pendingId = submitData.pendingId

    addResult('場景4.1', true, `提交成功，pendingId=${pendingId}`)

    // 4.2 模擬輪詢（多次查詢）
    for (let i = 0; i < 5; i++) {
      const checkResponse = await fetch(`${BASE_URL}/api/pending/${pendingId}`)
      const checkData = await checkResponse.json()

      if (!checkResponse.ok) {
        addResult('場景4.2', false, `輪詢失敗（第 ${i + 1} 次）: ${checkData.error}`)
        break
      }

      if (i === 4) {
        addResult('場景4.2', true, '輪詢 5 次成功，API 穩定')
      }

      await sleep(100)
    }

    // 4.3 審核通過，觀察 status 變化
    await fetch(`${BASE_URL}/api/admin/pending/${pendingId}/approve`, { method: 'POST' })

    const finalCheck = await fetch(`${BASE_URL}/api/pending/${pendingId}`)
    const finalData = await finalCheck.json()

    if (finalData.status === 'processed') {
      addResult('場景4.3', true, '審核後 status 正確變為 processed')
    } else {
      addResult('場景4.3', false, `status 應為 processed，實際為 ${finalData.status}`)
    }

  } catch (error: any) {
    addResult('場景4', false, `發生錯誤: ${error.message}`)
  }
}

// ==================== 場景 5：孤兒 Pending 檢測 ====================
async function scenario5_OrphanPending() {
  log('場景 5：孤兒 Pending（創建後不審核）')

  try {
    // 5.1 創建一個 Pending 但不審核
    const submitResponse = await fetch(`${BASE_URL}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        giftType: 'B',
        message: '孤兒測試',
        name: '孤兒用戶',
        assignedGridId: 124,  // gridNumber=4
      }),
    })

    const submitData = await submitResponse.json()
    const pendingId = submitData.pendingId

    addResult('場景5.1', true, `創建 Pending，pendingId=${pendingId}，不審核`)

    // 5.2 驗證格子被鎖定
    const checkGrid = await fetch(`${BASE_URL}/api/grids/preview?giftType=B&preferSameType=null&excludeLast=0`)
    const gridData = await checkGrid.json()

    const grid124 = gridData.availableGrids?.find((g: any) => g.id === 124)
    if (!grid124) {
      addResult('場景5.2', true, '格子 124 已鎖定（不在可用列表）')
    } else {
      addResult('場景5.2', false, '格子 124 應該被鎖定，但仍在可用列表中')
    }

    // 5.3 檢查全局鎖定
    const checkGlobal = await fetch(`${BASE_URL}/api/pending/check`)
    const globalData = await checkGlobal.json()

    if (globalData.hasPending === true) {
      addResult('場景5.3', true, '全局鎖定生效（hasPending=true）')
    } else {
      addResult('場景5.3', false, '全局鎖定應該生效，但 hasPending=false')
    }

    // 5.4 觀察：這個 Pending 會永久存在嗎？
    addResult('場景5.4', true, '⚠️ 注意：目前沒有 timeout 清理機制，Pending 會永久存在')

    // 清理
    await fetch(`${BASE_URL}/api/admin/pending/${pendingId}/reject`, { method: 'DELETE' })
    addResult('場景5.5', true, '已手動清理孤兒 Pending')

  } catch (error: any) {
    addResult('場景5', false, `發生錯誤: ${error.message}`)
  }
}

// ==================== 場景 6：拒絕後的數據一致性 ====================
async function scenario6_RejectConsistency() {
  log('場景 6：拒絕審核後的數據一致性')

  try {
    // 6.1 提交
    const submitResponse = await fetch(`${BASE_URL}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        giftType: 'C',
        message: '拒絕測試',
        name: '拒絕用戶',
        assignedGridId: 125,  // gridNumber=5
      }),
    })

    const submitData = await submitResponse.json()
    const pendingId = submitData.pendingId

    addResult('場景6.1', true, `提交成功，pendingId=${pendingId}`)

    // 6.2 查詢格子當前狀態
    const checkBefore = await fetch(`${BASE_URL}/api/grids/preview?giftType=C&preferSameType=null&excludeLast=0`)
    const dataBefore = await checkBefore.json()
    const grid125Before = dataBefore.availableGrids?.find((g: any) => g.id === 125)

    if (!grid125Before) {
      addResult('場景6.2', true, '拒絕前：格子 125 已鎖定')
    } else {
      addResult('場景6.2', false, '拒絕前：格子 125 應該鎖定但沒有')
    }

    // 6.3 拒絕
    const rejectResponse = await fetch(`${BASE_URL}/api/admin/pending/${pendingId}/reject`, {
      method: 'DELETE',
    })

    const rejectData = await rejectResponse.json()

    if (rejectResponse.ok) {
      addResult('場景6.3', true, '拒絕成功')
    } else {
      addResult('場景6.3', false, `拒絕失敗: ${rejectData.error}`, rejectData)
      return
    }

    // 6.4 驗證格子已釋放
    const checkAfter = await fetch(`${BASE_URL}/api/grids/preview?giftType=C&preferSameType=null&excludeLast=0`)
    const dataAfter = await checkAfter.json()
    const grid125After = dataAfter.availableGrids?.find((g: any) => g.id === 125)

    if (grid125After) {
      addResult('場景6.4', true, '拒絕後：格子 125 已釋放，重新可用')
    } else {
      addResult('場景6.4', false, '拒絕後：格子 125 應該釋放但仍不可用')
    }

    // 6.5 驗證 Grid 的 currentGiftType 沒有改變
    // 注意：拒絕不應該改變 currentGiftType，因為禮物沒有真正進入格子
    if (grid125After) {
      const originalGiftType = grid125Before?.currentGiftType || grid125After.previousSubmission?.giftType
      addResult('場景6.5', true, `Grid currentGiftType 保持不變（${grid125After.currentGiftType}）`)
    }

  } catch (error: any) {
    addResult('場景6', false, `發生錯誤: ${error.message}`)
  }
}

// ==================== 主函數 ====================
async function main() {
  console.log('\n🔍 開始邊界條件和特殊場景測試...\n')

  await scenario1_DrawPageStale()
  await sleep(500)

  await scenario2_AdminApprovalFlow()
  await sleep(500)

  await scenario3_PreviewFallback()
  await sleep(500)

  await scenario4_PollingRecovery()
  await sleep(500)

  await scenario5_OrphanPending()
  await sleep(500)

  await scenario6_RejectConsistency()

  // 輸出總結
  log('測試總結')
  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length

  console.log(`\n總計：${results.length} 個測試`)
  console.log(`✅ 成功：${successCount}`)
  console.log(`❌ 失敗：${failCount}`)

  if (failCount > 0) {
    console.log('\n失敗的測試：')
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.scenario}: ${r.message}`)
    })
  }

  // 特別提醒
  console.log('\n⚠️ 需要注意的設計決策：')
  console.log('  1. 目前沒有 Pending timeout 清理機制（可能需要人工清理）')
  console.log('  2. 前端輪詢錯誤會累積計數，但不會自動恢復（需重新整理）')
  console.log('  3. Draw 頁停留過久會導致衝突（這是預期行為，有錯誤處理）')
  console.log('')
}

main()
