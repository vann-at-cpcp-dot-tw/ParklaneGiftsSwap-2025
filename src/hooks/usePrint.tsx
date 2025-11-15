'use client'

import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import html2canvas from 'html2canvas'

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

    try {
      // 使用 html2canvas 將 HTML 轉成 canvas（縮小到 0.5 倍）
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 0.5,
        logging: false,
      })

      // 獲取 canvas 的 2D context（Epson SDK 需要）
      const context = canvas.getContext('2d')
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
      return undefined
    }
  }

  // 返回列印函數和模板組件
  const PrintTemplate = <PrintReceipt ref={receiptRef} data={printData} />

  return {
    print,
    PrintTemplate,
  }
}
