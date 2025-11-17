// X7BJ018561
'use client'

import { useEffect, useReducer } from 'react'

import { usePrint } from '~/hooks/usePrint'

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
  base64Image: string
  pendingId: number | null // 待審核記錄 ID
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
    base64Image: '',
    pendingId: null,
  })

  // 使用列印 hook
  const { print, PrintTemplate } = usePrint()

  // 初始化檢查：是否有待審核記錄（全局鎖定機制）
  useEffect(() => {
    const checkPending = async () => {
      try {
        const response = await fetch('/api/pending/check')
        const data = await response.json()

        if (data.hasPending) {
          // 強制進入 result 頁面（全局鎖定，不設定 pendingId）
          // 顯示：「其他參加者正在審核中...」
          setGameState({
            currentStep: 'result',
            pendingId: null,  // 不設定 pendingId，表示全局鎖定
          })
        }
      } catch (error) {
        console.error('檢查待審核記錄失敗:', error)
      }
    }

    checkPending()
  }, [])


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

    {/* 列印模板（隱藏） */}
    {PrintTemplate}
  </ScopeStoreProvider>
}
