// X7BJ018561
'use client'

import { useState, useRef } from 'react'

import html2canvas from 'html2canvas'

import { ScopeStoreProvider } from './scope-store'
import Guard from '../(game-steps)/Guard'

// TypeScript 宣告：Epson ePOS SDK 全域變數
declare global {
  interface Window {
    epson: any
  }
}

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

  // 列印模板 ref
  const receiptRef = useRef<HTMLDivElement>(null)

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

  // 列印圖片功能（使用官方 Epson ePOS SDK）
  const handlePrintImage = async () => {
    if (!drawResult?.previousSubmission || !receiptRef.current) {
      alert('沒有可列印的資料')
      return
    }

    // 檢查 SDK 是否載入
    if (typeof window.epson === 'undefined') {
      alert('Epson SDK 尚未載入，請重新整理頁面')
      return
    }

    setIsLoading(true)

    try {
      // 使用 html2canvas 將 HTML 轉成 canvas（保持 512px 寬度）
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 1,
        logging: false,
      })

      console.log('Canvas 尺寸:', canvas.width, 'x', canvas.height)

      // 檢查圖片高度限制
      const maxHeight = 1000 // TM-T82III 最大高度限制（保守估計）
      if (canvas.height > maxHeight) {
        throw new Error(`圖片太高 (${canvas.height}px)，超過印表機限制 (${maxHeight}px)。請簡化內容。`)
      }

      // 獲取 canvas 的 2D context（官方 SDK 需要）
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('無法獲取 canvas context')
      }

      // 創建 Epson ePOS Builder（官方 SDK）
      const builder = new window.epson.ePOSBuilder()

      // ⚠️ 重要：設定 halftone 和 brightness（這是 builder 的屬性，不是參數）
      builder.halftone = builder.HALFTONE_DITHER // 0 = dithering（最快）
      builder.brightness = 1.0 // 預設亮度（範圍 0.1-10.0）

      console.log('Builder 設定:', {
        halftone: builder.halftone,
        brightness: builder.brightness,
      })

      // 添加圖片（SDK 會自動處理 dithering 和 raster 轉換）
      // ⚠️ 注意：addImage 只接受 6 個參數（context, x, y, width, height, color）
      builder.addImage(
        context,
        0,
        0,
        canvas.width,
        canvas.height,
        builder.COLOR_1 // 單色列印
      )

      // 切紙
      builder.addCut(builder.CUT_FEED)

      // 獲取 XML 請求（builder.toString() 只返回 <epos-print> 內容）
      const eposPrintXml = builder.toString()

      // ⚠️ 關鍵：必須包裝成 SOAP envelope（根據官方協議）
      const request = `<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Header><parameter xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print" /></s:Header><s:Body>${eposPrintXml}</s:Body></s:Envelope>`

      console.log('XML Request 長度:', request.length)

      // 印表機 IP 和端點
      const printerIp = '192.168.0.123'
      const url = `http://${printerIp}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`

      // 發送到印表機
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'If-Modified-Since': 'Thu, 01 Jun 1970 00:00:00 GMT',
          'SOAPAction': '""',
        },
        body: request,
      })

      const responseText = await response.text()
      console.log('印表機回應:', responseText)

      if (!response.ok) {
        throw new Error(`印表機回應錯誤: ${response.status}`)
      }

      // 檢查回應是否包含錯誤
      if (responseText.includes('success="false"')) {
        throw new Error('列印失敗，印表機回報錯誤')
      }

      alert('列印成功！')
    } catch (error: any) {
      console.error('列印失敗:', error)
      alert(`列印失敗：${error.message}\n\n可能原因：\n1. 印表機未連線\n2. 印表機 IP 不正確\n3. 印表機未啟用 ePOS Print\n4. SDK 未正確載入`)
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

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={handleComplete}
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
                {isLoading ? '處理中...' : '確認完成交換'}
              </button>

              <button
                onClick={handlePrintImage}
                disabled={isLoading || !drawResult.previousSubmission}
                style={{
                  padding: '15px 30px',
                  fontSize: '18px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: isLoading || !drawResult.previousSubmission ? 'not-allowed' : 'pointer',
                  opacity: !drawResult.previousSubmission ? 0.5 : 1,
                }}
              >
                {isLoading ? '列印中...' : '列印小卡'}
              </button>

              <button
                onClick={() => window.print()}
                style={{
                  padding: '15px 30px',
                  fontSize: '18px',
                  backgroundColor: '#9E9E9E',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                瀏覽器列印
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 隱藏的列印模板（使用 html2canvas 轉成圖片）*/}
      {drawResult?.previousSubmission && (
        <div
          ref={receiptRef}
          style={{
            position: 'absolute',
            left: '-9999px',
            width: '512px',
            backgroundColor: '#ffffff',
            padding: '40px 20px',
            fontFamily: 'Arial, sans-serif',
            color: '#000000',
          }}
        >
          {/* 標題裝飾 */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '10px', letterSpacing: '2px', marginBottom: '10px' }}>
              ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
              禮物交換遊戲
            </div>
            <div style={{ fontSize: '20px', marginBottom: '10px' }}>
              Gift Exchange Card
            </div>
            <div style={{ fontSize: '10px', letterSpacing: '2px' }}>
              ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦
            </div>
          </div>

          {/* 主要內容 */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{
              borderTop: '3px solid #000',
              borderBottom: '3px solid #000',
              padding: '20px 0',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '18px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold' }}>編號</span>
                <span style={{ fontSize: '28px', fontWeight: 'bold' }}>#{drawResult.previousSubmission.participantNumber}</span>
              </div>
            </div>

            <div style={{ fontSize: '20px', lineHeight: '2' }}>
              <div style={{ marginBottom: '15px', borderBottom: '1px dashed #666', paddingBottom: '10px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>姓名 Name</div>
                <div style={{ fontWeight: 'bold', fontSize: '24px' }}>{drawResult.previousSubmission.name}</div>
              </div>

              <div style={{ marginBottom: '15px', borderBottom: '1px dashed #666', paddingBottom: '10px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>類型 Type</div>
                <div style={{ fontWeight: 'bold', fontSize: '24px' }}>{drawResult.previousSubmission.giftType}</div>
              </div>

              <div style={{ marginBottom: '15px', borderBottom: '1px dashed #666', paddingBottom: '10px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>留言 Message</div>
                <div style={{ fontSize: '18px', fontStyle: 'italic' }}>{drawResult.previousSubmission.message || '（無）'}</div>
              </div>

              {drawResult.previousSubmission.lineId && (
                <div style={{ marginBottom: '15px', borderBottom: '1px dashed #666', paddingBottom: '10px' }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>LINE ID</div>
                  <div style={{ fontSize: '18px' }}>{drawResult.previousSubmission.lineId}</div>
                </div>
              )}

              {drawResult.previousSubmission.instagram && (
                <div style={{ marginBottom: '15px', borderBottom: '1px dashed #666', paddingBottom: '10px' }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Instagram</div>
                  <div style={{ fontSize: '18px' }}>@{drawResult.previousSubmission.instagram}</div>
                </div>
              )}
            </div>
          </div>

          {/* 底部裝飾 */}
          <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #000' }}>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>
              ♡ 感謝參與 ♡
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Thank You for Participating
            </div>
          </div>
        </div>
      )}
    </ScopeStoreProvider>
  )
}
