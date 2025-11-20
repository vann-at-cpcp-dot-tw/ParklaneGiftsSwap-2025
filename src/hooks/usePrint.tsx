'use client'

import { useRef, useState } from 'react'

import html2canvas from 'html2canvas'
import { flushSync } from 'react-dom'

import PrintReceipt from '~/components/PrintReceipt'

/**
 * 列印資料類型定義
 */
export interface PreviousSubmission {
  participantNumber: number
  realParticipantNo: number | null
  giftType: string
  message: string
  name: string
  lineId: string | null
  instagram: string | null
}

export interface CurrentParticipant {
  participantNumber: number
  gridNumber: number
  giftType: string
}

export interface PrintData {
  previousSubmission: PreviousSubmission | null
  currentParticipant: CurrentParticipant
}

/**
 * 列印功能 Hook
 *
 * 用法：
 * ```tsx
 * const { print, PrintTemplate } = usePrint()
 *
 * // 在 JSX 中渲染隱藏的列印模板
 * return (
 *   <>
 *     <button onClick={() => print(data)}>列印</button>
 *     {PrintTemplate}
 *   </>
 * )
 * ```
 */
export function usePrint() {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [printData, setPrintData] = useState<PrintData | null>(null)

  /**
   * 列印功能
   * @param data 列印資料（包含上一位參加者和當前參加者資訊）
   * @returns Promise<boolean | undefined> 成功返回 true，失敗返回 undefined
   */
  const print = async (data: PrintData): Promise<boolean | undefined> => {
    // 使用 flushSync 強制同步更新 state，確保 DOM 立即更新
    flushSync(() => {
      setPrintData(data)
    })

    // 驗證必要資料
    if (!data.previousSubmission || !receiptRef.current) {
      alert('沒有可列印的資料')
      return
    }

    // 檢查 Epson SDK 是否載入
    if (typeof window.epson === 'undefined') {
      alert('Epson SDK 尚未載入，請重新整理頁面')
      return
    }

    let canvas: HTMLCanvasElement | null = null
    let flippedCanvas: HTMLCanvasElement | null = null

    try {
      // 使用 html2canvas 將 HTML 轉成 canvas（縮小到 0.5 倍）
      canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 0.5,
        logging: false,
      })

      // 創建翻轉的 canvas（上下顛倒 180 度）
      flippedCanvas = document.createElement('canvas')
      flippedCanvas.width = canvas.width
      flippedCanvas.height = canvas.height

      const flipCtx = flippedCanvas.getContext('2d')
      if (!flipCtx) {
        throw new Error('無法獲取 canvas context（翻轉）')
      }

      // 旋轉 180 度
      flipCtx.translate(canvas.width, canvas.height)
      flipCtx.rotate(Math.PI)
      flipCtx.drawImage(canvas, 0, 0)

      // ===== 測試預覽（暫時） =====
      // const previewUrl = flippedCanvas.toDataURL('image/png')
      // const previewWindow = window.open('', '_blank')
      // if (previewWindow) {
      //   previewWindow.document.write(`
      //     <html>
      //       <head><title>列印預覽（180度旋轉）</title></head>
      //       <body style="margin:0;padding:20px;background:#ccc;">
      //         <img src="${previewUrl}" style="max-width:100%;border:2px solid #000;" />
      //       </body>
      //     </html>
      //   `)
      // }
      // alert('預覽已開啟，請檢查新視窗')
      // return
      // ===== 測試預覽結束 =====

      // 獲取翻轉後 canvas 的 2D context（Epson SDK 需要）
      const context = flippedCanvas.getContext('2d')
      if (!context) {
        throw new Error('無法獲取 canvas context')
      }

      // 創建 Epson ePOS Builder
      const builder = new window.epson.ePOSBuilder()

      // 設定 halftone 和 brightness
      builder.halftone = builder.HALFTONE_DITHER // dithering 模式
      builder.brightness = 1.0 // 預設亮度（範圍 0.1-10.0）

      // 添加圖片
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

      // 獲取 XML 請求並包裝成 SOAP envelope
      const eposPrintXml = builder.toString()
      const request = `<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Header><parameter xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print" /></s:Header><s:Body>${eposPrintXml}</s:Body></s:Envelope>`

      // 印表機 IP 和端點（從環境變數讀取，必須設定）
      const printerIp = process.env.NEXT_PUBLIC_PRINTER_IP

      if (!printerIp) {
        throw new Error('伺服器配置錯誤：未設定印表機 IP（NEXT_PUBLIC_PRINTER_IP）')
      }

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
      return undefined
    } finally {
      // 顯式清理 canvas 記憶體，避免累積
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
        canvas.width = 0
        canvas.height = 0
      }

      if (flippedCanvas) {
        const ctx = flippedCanvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, flippedCanvas.width, flippedCanvas.height)
        }
        flippedCanvas.width = 0
        flippedCanvas.height = 0
      }
    }
  }

  // 返回列印函數和模板組件
  const PrintTemplate = <PrintReceipt ref={receiptRef} data={printData} />

  return {
    print,
    PrintTemplate,
  }
}
