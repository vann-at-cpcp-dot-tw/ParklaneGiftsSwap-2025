"use client"

import { useEffect, useRef, useState } from 'react'

import { twMerge } from 'tailwind-merge'

import { useScopeStore } from '~/app/[lang]/(home)/scope-store'



interface IProps {
  id?: string
  className?: string
}

export default function Result(props: IProps) {
  const { id, className } = props ?? {}
  const { gameState, setGameState, print } = useScopeStore()
  const [pollingError, setPollingError] = useState<string | null>(null)
  const errorCountRef = useRef(0)
  const hasSubmittedRef = useRef(false)  // 防止重複提交

  // 提交審核
  const handleComplete = async () => {
    if (!gameState.drawResult || gameState.isLoading) return

    setGameState({ isLoading: true })

    try {
      // 將用戶選擇轉換為 API 參數
      const preferSameType =
        gameState.drawResult.userPreference === 'same' ? true :
          gameState.drawResult.userPreference === 'different' ? false :
            null  // random

      // 創建待審核記錄（不列印，不寫入 Submission）
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftType: gameState.giftType,
          message: gameState.message || '',
          name: gameState.name,
          lineId: gameState.lineId || '',
          instagram: gameState.instagram || '',
          assignedGridId: gameState.drawResult.submission.assignedGridId, // 使用預選的格子
          preferSameType,  // 使用正確的用戶偏好
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // 處理格子已被佔用的情況
        if (data.retryable) {
          alert('格子已被佔用，請重新抽選')
          setGameState({ drawResult: null, currentStep: 'draw', isLoading: false })
          return
        }
        throw new Error(data.error || '完成交換失敗')
      }

      // 保存 pendingId，開始輪詢（不重置流程）
      setGameState({
        pendingId: data.pendingId,
        isLoading: false,
      })

    } catch (error: any) {
      alert(error.message)
      setGameState({ isLoading: false })
    }
  }

  // 自動提交審核（進入頁面時）
  useEffect(() => {
    // 只在有 drawResult 且沒有 pendingId 且尚未提交時，自動提交
    if (gameState.drawResult && !gameState.pendingId && !hasSubmittedRef.current) {
      hasSubmittedRef.current = true
      handleComplete()
    }
  }, [])

  // 統一的全局鎖定狀態輪詢
  useEffect(() => {

    // 只有在「有 drawResult 但沒 pendingId」時不輪詢（正在提交中）
    if (gameState.drawResult && !gameState.pendingId) {
      return
    }

    const checkGlobalLock = async () => {
      try {
        const response = await fetch('/api/pending/check')
        const data = await response.json()

        if (!data.hasPending) {
          // 全局鎖定已解除（所有審核都完成），返回首頁
          errorCountRef.current = 0
          setPollingError(null)
          setGameState({
            pendingId: null,
            drawResult: null,
            currentStep: 'welcome',
            giftType: null,
            message: '',
            name: '',
            lineId: '',
            instagram: '',
            estimatedParticipantNo: null,
          })
        } else {
          // 仍有 pending，重置錯誤計數
          errorCountRef.current = 0
          setPollingError(null)
        }
      } catch (error) {
        console.error('檢查全局鎖定狀態失敗:', error)
        errorCountRef.current += 1

        if (errorCountRef.current >= 3) {
          // 連續 3 次失敗，顯示錯誤訊息
          setPollingError('網路連線異常，請檢查網路或聯繫工作人員')
        }
        // 繼續輪詢（不中斷 interval）
      }
    }

    // 立即檢查一次
    checkGlobalLock()

    // 每 2 秒輪詢一次
    const interval = setInterval(checkGlobalLock, 2000)

    return () => {
      clearInterval(interval)
      errorCountRef.current = 0
      setPollingError(null)
    }
  }, [setGameState, gameState.pendingId, gameState.drawResult])

  return <div className={twMerge('min-h-full flex flex-col', className)}>
    <div className="container pt-10">
      <div className="flex justify-center">
        <img src="/img/title_result.svg" alt="" />
      </div>

      <div className="bg-[#DCDD9B] pt-10">
        <div className="mb-10 text-center text-[48px] font-bold text-red">恭喜你完成配對任務</div>

        <div className="mx-auto flex max-w-[680px] !flex-nowrap items-end">
          <div className="flex-none">
            <img className="relative top-[4px]" src="/img/robot.svg" alt="" />
          </div>
          <div className="shrink pb-12 pl-12 text-[32px] font-semibold text-[#3A6848]">
            <div className="mb-6">
            快跟銀色小精靈<br/>
            領取你的訊息<br/>
            再跟櫃檯人員換取鑰匙卡<br/>
            即可前往禮物櫃<br/>
            開啟專屬你的聖誕驚喜<br/>
            </div>
            <div className="flex flex-col items-center">
              {
                pollingError
                  ? <div className="mt-4 text-center text-[20px] font-semibold text-red-600">
                    { pollingError }
                  </div>
                  : <div className="flex justify-center">
                    <div className="flex items-center justify-center whitespace-nowrap rounded-full bg-[#3E1914] px-8 py-2 text-[28px] font-bold text-[#DCDD9B]">
                  ...與銀色小精靈通訊中...
                    </div>
                  </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="grow"
    style={{
      backgroundImage: 'url(/img/bg_result_bottom.svg)',
      backgroundRepeat: 'repeat',
    }}>

    </div>
  </div>
}
