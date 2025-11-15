// X7BJ018561
'use client'

import { useReducer, useRef, useCallback } from 'react'

import html2canvas from 'html2canvas'

import { isEmpty, padLeft} from '~/lib/utils'

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
  estimatedParticipantNo: number | null,
  drawResult: DrawResult | null,
  printInfo: {
    description: {
      A: string | React.ReactNode
      B: string | React.ReactNode
      C: string | React.ReactNode
    }
  },
  base64Image: string
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
    estimatedParticipantNo: null,
    drawResult: null,
    printInfo: {
      description: {
        A: <div>
          嘿！收到禮物的幸運星：）<br/>
          不知道我們是不是同頻的人，但沒關係！<br/>
          能相遇就是千萬分之一的奇蹟，<br/>
          有緣分在這裡把這份禮物送給你<br/>，
          希望它能替你的聖誕節增加一點噪音、一點笑聲、讓今年的日子更熱鬧一點！
        </div>,
        B: <div>
          嘿！收到禮物的幸運星：）<br/>
          也許我們只在這個聖誕節交會，<br/>
          但能把心意傳遞出去，已經是很浪漫的奇蹟了。<br/>
          我準備這份禮物的時候，<br/>
          腦中一直想著：希望收到的人能被好好對待！
        </div>,
        C: <div>
          嘿！收到禮物的幸運星：）<br/>
          我其實沒想太多，只是剛好看到這份禮物，<br/>
          覺得「啊，這好像會讓人開心」，就選了它。<br/>
          有時候最美的事情就是這樣隨性發生。
        </div>,
      }
    },
    base64Image: '',
  })

  // 列印模板 ref
  const receiptRef = useRef<HTMLDivElement>(null)

  // 使用 ref 存儲最新的 gameState，確保 print 函數總是讀取最新值
  const gameStateRef = useRef(gameState)
  gameStateRef.current = gameState

  // 列印圖片功能（使用官方 Epson ePOS SDK）
  const print = useCallback(async () => {
    if (!gameStateRef.current.drawResult?.previousSubmission || !receiptRef.current) {
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
        // scale: 1,
        scale: 0.5,
        logging: false,
      })

      // setGameState({ base64Image: canvas.toDataURL('image/png') })

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

      // 列印成功
      return true

    } catch (error: any) {
      console.error('列印失敗:', error)
      alert(`列印失敗：${error.message}\n\n可能原因：\n1. 印表機未連線\n2. 印表機 IP 不正確\n3. 印表機未啟用 ePOS Print\n4. SDK 未正確載入`)
    } finally {
      setGameState({ isLoading: false })
    }
  }, [])  // 空依賴數組，因為通過 gameStateRef 讀取最新值


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

    <img src={gameState.base64Image} alt="" />

    <div
    ref={receiptRef}
    style={{
      position: 'fixed',
      left: '-9999px',
      // width: '568px',
      // width: '576px',
      width: '1152px',
      backgroundColor: '#ffffff',
      color: '#000000',
    }}>
      <div className="mb-[60px] pt-10">
        <img className="w-full" src="/img/print_title.svg" alt="" />
      </div>

      <div className="my-[100px] px-[40px] text-[50px] leading-[2]">{ gameState.printInfo.description[gameState?.drawResult?.previousSubmission?.giftType as 'A']}</div>

      <div className="mb-[100px]">
        <img className="w-full" src="/img/print_line_1.svg" alt="" />
      </div>

      <div className="mb-[80px]">
        <div className="-mb-5 text-center text-[60px]">
          {
            gameState?.drawResult?.submission?.participantNumber
              ? <div>參賽者 # {padLeft(String(gameState?.drawResult?.submission?.participantNumber), 5)}</div>
              : ''
          }
          <div>我們的共同神秘密碼是</div>
        </div>
        <div className="flex items-end justify-center text-center" style={{ fontWeight: 900, lineHeight: 1 }}>
          <span className="text-[100px]">no.</span>
          <span className="text-[240px]">{ gameState?.drawResult?.submission?.gridNumber }</span>
        </div>
      </div>

      <div className="-mb-10 pt-[80px]">
        <img className="w-full" src="/img/print_line_2.svg" alt="" />
      </div>

      <div className="pb-[100px]">
        <div className="flex flex-nowrap items-start justify-center" style={{ paddingTop:'120px', marginBottom: '-250px', marginLeft: '110px' }}>
          <img src="/img/print_deco_1.svg" alt="" style={{ width:'160px' }}/>
          <div className="px-12 text-[60px]" style={{ marginTop:'60px' }}>想對你說：</div>
          <img className="relative" src="/img/print_deco_2.svg" alt="" style={{ width: '190px', marginTop:'200px', right:'-60px' }}/>
        </div>
        <div className="mx-auto text-center"
        style={{
          fontSize: '300px',
          lineHeight: 1,
          fontWeight: 900,
        }}>
          {
            (gameState?.drawResult?.previousSubmission?.message || '').split('').map((node, index)=>{
              return <div key={index}>
                {
                  node === ' ' ? '\u00A0' : node
                }
              </div>
            })
          }
        </div>
      </div>

      <div className="mb-[100px] pt-[120px]">
        <img className="w-full" src="/img/print_line_1.svg" alt="" />
      </div>

      <div className="px-[40px] text-[60px]">
        <div className="mb-[60px] text-[60px]">如果你也想繼續派對模式，來找我吧！</div>
        <div className="flex flex-nowrap">
          <div className="flex-none font-bold">NAME：</div>
          <div className="flex-grow">{ gameState.drawResult?.previousSubmission?.name }</div>
        </div>
        <div className="flex flex-nowrap">
          <div className="flex-none font-bold">LINE：</div>
          <div className="flex-grow">{ gameState.drawResult?.previousSubmission?.lineId }</div>
        </div>
        <div className="flex flex-nowrap">
          <div className="flex-none font-bold">IG：</div>
          <div className="flex-grow">{ gameState.drawResult?.previousSubmission?.instagram }</div>
        </div>
      </div>

      <div className="px-[40px] pb-[80px] pt-[120px]">
        <img className="w-full" src="/img/print_merry.svg" alt="" />
      </div>
    </div>
  </ScopeStoreProvider>
}
