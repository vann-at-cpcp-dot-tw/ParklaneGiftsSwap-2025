// X7BJ018561
'use client'

import { useReducer, useRef } from 'react'

import html2canvas from 'html2canvas'

import { ScopeStoreProvider } from './scope-store'
import Contact  from "../(game-steps)/Contact"
import Draw from "../(game-steps)/Draw"
import Message from "../(game-steps)/Message"
import MyType from "../(game-steps)/MyType"
import Result from "../(game-steps)/Result"
import Test from "../(game-steps)/Test"
import Welcome from "../(game-steps)/Welcome"

// TypeScript 宣告：Epson ePOS SDK 全域變數
declare global {
  interface Window {
    epson: any
  }
}

export interface DrawResult {
  success: boolean
  matchedPreference: boolean
  submission: {
    id?: number  // 抽選時尚未分配，確認時才有
    participantNumber?: number  // 抽選時尚未分配，確認時才有
    giftType: string
    assignedGridId: number
    gridNumber: number
  }
  previousSubmission: {
    participantNumber: number
    realParticipantNo: number | null
    giftType: string
    message: string
    name: string
    lineId: string | null
    instagram: string | null
  } | null
}

interface IState {
  isLoading: boolean
  currentStep: 'welcome' | 'test' | 'message' | 'contact' | 'myType' | 'draw' | 'result'
  giftType: 'A' | 'B' | 'C' | null
  message: '',
  name: '',
  lineId: '',
  instagram: '',
  drawResult: DrawResult | null
}


export default function Home() {
  const [gameState, setGameState] = useReducer((state:IState, updateState:{})=>({...state, ...updateState}), {
    isLoading: false,
    currentStep: 'welcome',
    giftType: null,
    message: '',
    name: '',
    lineId: '',
    instagram: '',
    drawResult: null,
  })

  // 列印模板 ref
  const receiptRef = useRef<HTMLDivElement>(null)

  // 列印圖片功能（使用官方 Epson ePOS SDK）
  const print = async () => {
    if (!gameState.drawResult?.previousSubmission || !receiptRef.current) {
      alert('沒有可列印的資料')
      return
    }

    // 檢查 SDK 是否載入
    if (typeof window.epson === 'undefined') {
      alert('Epson SDK 尚未載入，請重新整理頁面')
      return
    }

    setGameState({ isLoading: true })

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
      setGameState({ isLoading: false })
    }
  }


  return <ScopeStoreProvider state={{gameState, setGameState, print}}>
    {
      gameState.currentStep === 'welcome' && <Welcome />
    }

    {
      gameState.currentStep === 'test' && <Test />
    }

    {
      gameState.currentStep === 'message' && <Message />
    }

    {
      gameState.currentStep === 'contact' && <Contact />
    }

    {
      gameState.currentStep === 'myType' && <MyType />
    }

    {
      gameState.currentStep === 'draw' && <Draw />
    }

    {
      gameState.currentStep === 'result' && <Result />
    }

    {/* 列印 */}
    <div
          ref={receiptRef}
          style={{
            position: 'fixed',
            left: '-9999px',
            width: '512px',
            backgroundColor: '#ffffff',
            padding: '40px 20px',
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
        <div
              style={{
                borderTop: '3px solid #000',
                borderBottom: '3px solid #000',
                padding: '20px 0',
                marginBottom: '20px',
              }}
        >
          <div style={{ fontSize: '18px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold' }}>格子編號</span>
            <span style={{ fontSize: '28px', fontWeight: 'bold' }}>
                  #{gameState?.drawResult?.submission?.gridNumber}
            </span>
          </div>
        </div>

        <div style={{ fontSize: '20px', lineHeight: '2' }}>
          <div style={{ marginBottom: '15px', borderBottom: '1px dashed #666', paddingBottom: '10px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>姓名 Name</div>
            <div style={{ fontWeight: 'bold', fontSize: '24px' }}>{gameState?.drawResult?.previousSubmission?.name}</div>
          </div>

          <div style={{ marginBottom: '15px', borderBottom: '1px dashed #666', paddingBottom: '10px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>類型 Type</div>
            <div style={{ fontWeight: 'bold', fontSize: '24px' }}>{gameState?.drawResult?.previousSubmission?.giftType}</div>
          </div>

          <div style={{ marginBottom: '15px', borderBottom: '1px dashed #666', paddingBottom: '10px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>留言 Message</div>
            <div style={{ fontSize: '18px', fontStyle: 'italic' }}>
              {gameState?.drawResult?.previousSubmission?.message || '（無）'}
            </div>
          </div>

          {gameState?.drawResult?.previousSubmission?.lineId && (
            <div style={{ marginBottom: '15px', borderBottom: '1px dashed #666', paddingBottom: '10px' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>LINE ID</div>
              <div style={{ fontSize: '18px' }}>{gameState.drawResult.previousSubmission.lineId}</div>
            </div>
          )}

          {gameState?.drawResult?.previousSubmission?.instagram && (
            <div style={{ marginBottom: '15px', borderBottom: '1px dashed #666', paddingBottom: '10px' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Instagram</div>
              <div style={{ fontSize: '18px' }}>@{gameState.drawResult.previousSubmission.instagram}</div>
            </div>
          )}
        </div>
      </div>

      {/* 底部裝飾 */}
      <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #000' }}>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>♡ 感謝參與 ♡</div>
        <div style={{ fontSize: '12px', color: '#666' }}>Thank You for Participating</div>
      </div>
    </div>
  </ScopeStoreProvider>
}
