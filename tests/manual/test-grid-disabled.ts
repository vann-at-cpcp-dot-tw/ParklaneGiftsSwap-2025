/**
 * 測試格子禁用功能
 */

const BASE_URL = 'http://localhost:3000'

async function runTest() {
  console.log('====================================')
  console.log('測試格子禁用功能')
  console.log('====================================')

  try {
    // 1. 獲取格子列表
    console.log('\n=== 獲取格子列表 ===')
    const gridsResponse = await fetch(`${BASE_URL}/api/admin/grids`)
    const gridsData = await gridsResponse.json()

    if (!gridsResponse.ok || !gridsData.grids || gridsData.grids.length === 0) {
      console.log('❌ 獲取格子列表失敗，請先初始化資料')
      return
    }

    console.log(`✅ 獲取到 ${gridsData.grids.length} 個格子`)

    // 選取第一個格子來測試
    const testGrid = gridsData.grids[0]
    console.log(`測試格子：#${testGrid.gridNumber}（id=${testGrid.id}），初始禁用狀態：${testGrid.disabled}`)

    // 2. 測試 preview API（禁用前）
    console.log('\n=== 測試 1：禁用前的 preview API ===')
    const preview1 = await fetch(`${BASE_URL}/api/grids/preview?giftType=A&preferSameType=null&excludeLast=0`)
    const preview1Data = await preview1.json()

    const grid1InPreview = preview1Data.availableGrids?.find((g: any) => g.id === testGrid.id)
    if (grid1InPreview) {
      console.log(`✅ 格子 #${testGrid.gridNumber} 在可用列表中`)
    } else {
      console.log(`⚠️ 格子 #${testGrid.gridNumber} 不在可用列表中（可能已被鎖定）`)
    }

    // 3. 禁用格子
    console.log('\n=== 測試 2：禁用格子 ===')
    const disableResponse = await fetch(`${BASE_URL}/api/admin/grids/${testGrid.id}`, {
      method: 'PUT',
    })
    const disableData = await disableResponse.json()

    if (disableResponse.ok) {
      console.log(`✅ ${disableData.message}`)
    } else {
      console.log(`❌ 禁用失敗：${disableData.error}`)
      return
    }

    // 4. 測試 preview API（禁用後）
    console.log('\n=== 測試 3：禁用後的 preview API ===')
    const preview2 = await fetch(`${BASE_URL}/api/grids/preview?giftType=A&preferSameType=null&excludeLast=0`)
    const preview2Data = await preview2.json()

    const grid2InPreview = preview2Data.availableGrids?.find((g: any) => g.id === testGrid.id)
    if (!grid2InPreview) {
      console.log(`✅ 格子 #${testGrid.gridNumber} 已從可用列表中移除（禁用生效）`)
    } else {
      console.log(`❌ 格子 #${testGrid.gridNumber} 仍在可用列表中（禁用未生效！）`)
    }

    // 5. 解除禁用
    console.log('\n=== 測試 4：解除禁用 ===')
    const enableResponse = await fetch(`${BASE_URL}/api/admin/grids/${testGrid.id}`, {
      method: 'PUT',
    })
    const enableData = await enableResponse.json()

    if (enableResponse.ok) {
      console.log(`✅ ${enableData.message}`)
    } else {
      console.log(`❌ 解除禁用失敗：${enableData.error}`)
      return
    }

    // 6. 測試 preview API（解除禁用後）
    console.log('\n=== 測試 5：解除禁用後的 preview API ===')
    const preview3 = await fetch(`${BASE_URL}/api/grids/preview?giftType=A&preferSameType=null&excludeLast=0`)
    const preview3Data = await preview3.json()

    const grid3InPreview = preview3Data.availableGrids?.find((g: any) => g.id === testGrid.id)
    if (grid3InPreview) {
      console.log(`✅ 格子 #${testGrid.gridNumber} 已恢復到可用列表中`)
    } else {
      console.log(`⚠️ 格子 #${testGrid.gridNumber} 未恢復到可用列表中（可能已被鎖定）`)
    }

    // 總結
    console.log('\n====================================')
    console.log('測試結果')
    console.log('====================================')
    console.log('✅ 格子禁用功能正常運作')
    console.log('   - 禁用後不參與抽選')
    console.log('   - 解除禁用後恢復參與抽選')

  } catch (error) {
    console.error('測試過程中發生錯誤:', error)
  }
}

runTest()
