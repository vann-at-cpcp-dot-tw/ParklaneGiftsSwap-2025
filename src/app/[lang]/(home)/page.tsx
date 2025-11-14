'use client'

import { useState } from 'react'

import { ScopeStoreProvider } from './scope-store'
import Guard from '../(game-steps)/Guard'

interface DrawResult {
  submission: {
    id: number
    participantNumber: number
    giftType: string
    assignedGridId: number
    gridNumber: number
  }
  previousSubmission: {
    participantNumber: number
    giftType: string
    message: string
    name: string
    lineId: string | null
    instagram: string | null
  } | null
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState('guard')
  const [giftType, setGiftType] = useState<'A' | 'B' | 'C' | null>(null)
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [lineId, setLineId] = useState('')
  const [instagram, setInstagram] = useState('')
  const [drawResult, setDrawResult] = useState<DrawResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 選擇禮物類型（簡化版心理測驗）
  const handleSelectType = (type: 'A' | 'B' | 'C') => {
    setGiftType(type)
    setCurrentStep('message')
  }

  // 送出留言並抽獎
  const handleDraw = async () => {
    if (!giftType) {
      alert('請先選擇類型')
      return
    }

    if (!name.trim()) {
      alert('請填寫姓名')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ giftType, message, name, lineId, instagram }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '抽獎失敗')
      }

      setDrawResult(data)
      setCurrentStep('result')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 完成交換
  const handleComplete = async () => {
    if (!drawResult) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: drawResult.submission.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '完成交換失敗')
      }

      alert('交換完成！')
      // 重置流程
      setCurrentStep('guard')
      setGiftType(null)
      setMessage('')
      setName('')
      setLineId('')
      setInstagram('')
      setDrawResult(null)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ScopeStoreProvider state={{ data: { hello: 'world' } }}>
      {/* 步驟 1: 驗證碼 */}
      {currentStep === 'guard' && (
        <Guard onValidated={() => setCurrentStep('test')} />
      )}

      {/* 步驟 2: 選擇類型（簡化版心理測驗）*/}
      {currentStep === 'test' && (
        <div style={{ padding: '20px' }}>
          <h2>選擇你的禮物類型（簡化版心理測驗）</h2>
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => handleSelectType('A')}
              style={{ margin: '10px', padding: '20px', fontSize: '20px' }}
            >
              類型 A
            </button>
            <button
              onClick={() => handleSelectType('B')}
              style={{ margin: '10px', padding: '20px', fontSize: '20px' }}
            >
              類型 B
            </button>
            <button
              onClick={() => handleSelectType('C')}
              style={{ margin: '10px', padding: '20px', fontSize: '20px' }}
            >
              類型 C
            </button>
          </div>
        </div>
      )}

      {/* 步驟 3: 20 字留言 */}
      {currentStep === 'message' && (
        <div style={{ padding: '20px' }}>
          <h2>留下 20 字留言</h2>
          <p>你選擇的類型：{giftType}</p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={20}
            placeholder="最多 20 字"
            style={{
              width: '100%',
              height: '100px',
              fontSize: '16px',
              padding: '10px',
            }}
          />
          <div>
            <button
              onClick={() => setCurrentStep('contact')}
              style={{ marginTop: '20px', padding: '15px 30px', fontSize: '18px' }}
            >
              下一步
            </button>
          </div>
        </div>
      )}

      {/* 步驟 4: 聯絡資訊 */}
      {currentStep === 'contact' && (
        <div style={{ padding: '20px' }}>
          <h2>填寫聯絡資訊</h2>
          <p>你選擇的類型：{giftType}</p>

          <div style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                姓名 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="請輸入姓名"
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                LINE ID
              </label>
              <input
                type="text"
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                placeholder="選填"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Instagram
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="選填"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setCurrentStep('message')}
                style={{ padding: '15px 30px', fontSize: '18px' }}
              >
                上一步
              </button>
              <button
                onClick={handleDraw}
                disabled={isLoading}
                style={{
                  padding: '15px 30px',
                  fontSize: '18px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? '抽獎中...' : '送出並抽獎'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 步驟 5: 顯示結果 */}
      {currentStep === 'result' && drawResult && (
        <div style={{ padding: '20px' }}>
          <h2>抽獎結果</h2>
          <div style={{ marginTop: '20px' }}>
            <p>你是第 {drawResult.submission.participantNumber} 號參加者</p>
            <p>你的類型：{drawResult.submission.giftType}</p>
            <p>抽到的格子：{drawResult.submission.gridNumber} 號</p>

            <hr style={{ margin: '20px 0' }} />

            <h3>上一個參加者的資訊（列印用）</h3>
            {drawResult.previousSubmission ? (
              <div>
                <p>編號：{drawResult.previousSubmission.participantNumber}</p>
                <p>姓名：{drawResult.previousSubmission.name}</p>
                <p>類型：{drawResult.previousSubmission.giftType}</p>
                <p>留言：{drawResult.previousSubmission.message}</p>
                {drawResult.previousSubmission.lineId && (
                  <p>LINE ID：{drawResult.previousSubmission.lineId}</p>
                )}
                {drawResult.previousSubmission.instagram && (
                  <p>Instagram：{drawResult.previousSubmission.instagram}</p>
                )}
              </div>
            ) : (
              <p>這是第一個禮物（工作人員預設禮物）</p>
            )}

            <hr style={{ margin: '20px 0' }} />

            <button
              onClick={handleComplete}
              disabled={isLoading}
              style={{ padding: '15px 30px', fontSize: '18px' }}
            >
              {isLoading ? '處理中...' : '確認完成交換'}
            </button>

            <button
              onClick={() => window.print()}
              style={{
                marginLeft: '10px',
                padding: '15px 30px',
                fontSize: '18px',
              }}
            >
              重新列印
            </button>
          </div>
        </div>
      )}
    </ScopeStoreProvider>
  )
}
