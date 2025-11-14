'use client'

import { useState } from 'react'

interface GiftForm {
  giftType: 'A' | 'B' | 'C'
  message: string
  name: string
  lineId: string
  instagram: string
}

export default function AdminPage() {
  const [showManualForm, setShowManualForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [gifts, setGifts] = useState<GiftForm[]>(
    Array.from({ length: 30 }, () => ({
      giftType: 'A',
      message: '',
      name: '',
      lineId: '',
      instagram: '',
    }))
  )

  // 隨機初始化
  const handleRandomInit = async () => {
    if (!confirm('確定要隨機生成 30 個初始禮物嗎？')) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/init-random', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '初始化失敗')
      }

      alert(`成功！${data.message}`)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 手動初始化
  const handleManualInit = async () => {
    if (!confirm('確定要使用手動輸入的資料初始化嗎？')) return

    // 驗證必填欄位
    for (let i = 0; i < gifts.length; i++) {
      if (!gifts[i].name.trim()) {
        alert(`第 ${i + 1} 個禮物缺少姓名`)
        return
      }
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/init-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gifts }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '初始化失敗')
      }

      alert(`成功！${data.message}`)
      setShowManualForm(false)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 清空資料
  const handleReset = async () => {
    if (!confirm('⚠️ 危險操作！確定要清空所有資料嗎？此操作無法復原！')) return
    if (!confirm('再次確認：真的要刪除所有格子和參加者記錄嗎？')) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/reset', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '清空失敗')
      }

      alert(`成功！${data.message}`)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 更新禮物資料
  const updateGift = (index: number, field: keyof GiftForm, value: string) => {
    const newGifts = [...gifts]
    newGifts[index] = { ...newGifts[index], [field]: value }
    setGifts(newGifts)
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px' }}>🎁 禮物交換遊戲 - 管理介面</h1>

      {/* 快速操作區 */}
      <div style={{ marginBottom: '40px' }}>
        <h2>快速操作</h2>
        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
          <button
            onClick={handleRandomInit}
            disabled={isLoading}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? '處理中...' : '🎲 隨機生成測試資料'}
          </button>

          <button
            onClick={() => setShowManualForm(!showManualForm)}
            disabled={isLoading}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {showManualForm ? '隱藏手動輸入表單' : '📝 手動輸入初始資料'}
          </button>

          <button
            onClick={handleReset}
            disabled={isLoading}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? '處理中...' : '🗑️ 清空所有資料'}
          </button>
        </div>
      </div>

      {/* 手動輸入表單 */}
      {showManualForm && (
        <div style={{ marginTop: '40px' }}>
          <h2>手動輸入 30 個初始禮物</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            請填寫每個格子的初始禮物資訊（* 為必填欄位）
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '20px',
              marginTop: '20px',
            }}
          >
            {gifts.map((gift, index) => (
              <div
                key={index}
                style={{
                  border: '1px solid #ddd',
                  padding: '15px',
                  borderRadius: '8px',
                  backgroundColor: '#f9f9f9',
                }}
              >
                <h3 style={{ marginBottom: '10px' }}>格子 {index + 1}</h3>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    類型 *
                  </label>
                  <select
                    value={gift.giftType}
                    onChange={(e) =>
                      updateGift(index, 'giftType', e.target.value as 'A' | 'B' | 'C')
                    }
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <option value="A">類型 A</option>
                    <option value="B">類型 B</option>
                    <option value="C">類型 C</option>
                  </select>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    姓名 *
                  </label>
                  <input
                    type="text"
                    value={gift.name}
                    onChange={(e) => updateGift(index, 'name', e.target.value)}
                    placeholder="請輸入姓名"
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    留言（最多 20 字）
                  </label>
                  <input
                    type="text"
                    value={gift.message}
                    onChange={(e) =>
                      updateGift(index, 'message', e.target.value.slice(0, 20))
                    }
                    maxLength={20}
                    placeholder="選填"
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    LINE ID
                  </label>
                  <input
                    type="text"
                    value={gift.lineId}
                    onChange={(e) => updateGift(index, 'lineId', e.target.value)}
                    placeholder="選填"
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={gift.instagram}
                    onChange={(e) => updateGift(index, 'instagram', e.target.value)}
                    placeholder="選填"
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <button
              onClick={handleManualInit}
              disabled={isLoading}
              style={{
                padding: '15px 40px',
                fontSize: '18px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? '處理中...' : '✅ 確認送出並初始化'}
            </button>
          </div>
        </div>
      )}

      {/* 說明區 */}
      <div style={{ marginTop: '60px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h2>使用說明</h2>
        <ul style={{ lineHeight: '1.8' }}>
          <li><strong>隨機生成測試資料</strong>：自動創建 30 個格子和隨機的初始禮物資料，適合快速測試</li>
          <li><strong>手動輸入初始資料</strong>：逐筆填寫每個格子的禮物資訊，適合正式上線前準備</li>
          <li><strong>清空所有資料</strong>：刪除所有格子和參加者記錄，重置遊戲（危險操作，請謹慎使用）</li>
        </ul>
        <p style={{ marginTop: '20px', color: '#666' }}>
          ⚠️ 注意：如果資料庫中已有資料，初始化操作會失敗。請先清空資料再進行初始化。
        </p>
      </div>
    </div>
  )
}
