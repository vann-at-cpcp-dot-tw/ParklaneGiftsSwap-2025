"use client"

const APP_BASE = process.env.NEXT_PUBLIC_APP_BASE || '/'

import { useEffect } from 'react'

import { twMerge } from 'tailwind-merge'

import { useScopeStore } from '~/app/[lang]/(home)/scope-store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { isEmpty } from '~/lib/utils'



interface IProps {
  id?: string
  className?: string
}

export default function Result(props: IProps) {
  const { id, className } = props ?? {}
  const { gameState, setGameState, print } = useScopeStore()


  // 提交審核
  const handleComplete = async () => {
    if (!gameState.drawResult || gameState.isLoading) return

    setGameState({ isLoading: true })

    try {
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
          preferSameType: gameState.drawResult.matchedPreference ? true : null, // 保留偏好記錄
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // 處理格子已被佔用的情況
        if (data.retryable) {
          alert('格子已被佔用（可能其他裝置搶先），請重新抽選')
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

  // 輪詢審核狀態
  useEffect(() => {
    if (!gameState.pendingId) return

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/pending/${gameState.pendingId}`)
        const data = await response.json()

        if (data.status === 'processed') {
          // 審核完成（通過或拒絕），重置流程回到首頁
          setGameState({
            pendingId: null,
            drawResult: null,
            currentStep: 'welcome',
            giftType: null,
            message: '',
            name: '',
            lineId: '',
            instagram: '',
          })
        }
      } catch (error) {
        console.error('檢查審核狀態失敗:', error)
      }
    }

    // 立即檢查一次
    checkStatus()

    // 每 2 秒輪詢一次
    const interval = setInterval(checkStatus, 2000)

    return () => clearInterval(interval)
  }, [gameState.pendingId])

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
            <div className="mb-8">
            快跟銀色小精靈<br/>
            領取你的訊息<br/>
            再跟櫃檯人員換取鑰匙卡<br/>
            即可前往禮物櫃<br/>
            開啟專屬你的聖誕驚喜<br/>
            </div>
            <div className="flex justify-center">
              {!gameState.drawResult && !gameState.pendingId ? (
                // 鎖定狀態：有其他人的待審核記錄（頁面重新載入後進入此狀態）
                <div className="flex h-[64px] w-[400px] items-center justify-center rounded-full bg-[#3E1914] text-[28px] font-bold text-[#DCDD9B]">
                  其他參加者正在審核中...
                </div>
              ) : gameState.pendingId ? (
                // 審核中：自己的申請正在審核
                <div className="flex h-[64px] w-[320px] items-center justify-center rounded-full bg-[#3E1914] text-[28px] font-bold text-[#DCDD9B]">
                  審核中，請稍候...
                </div>
              ) : (
                // 正常流程：顯示 GO 按鈕
                <button
                  className="flex h-[64px] w-[200px] items-center justify-center rounded-full bg-[#3E1914] text-[32px] font-bold text-[#DCDD9B]"
                  onClick={handleComplete}
                  disabled={gameState.isLoading}
                >
                  {gameState.isLoading ? '...通訊中...' : 'GO！'}
                </button>
              )}
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
