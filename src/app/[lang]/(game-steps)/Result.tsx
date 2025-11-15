"use client"

const APP_BASE = process.env.NEXT_PUBLIC_APP_BASE || '/'

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


  // 完成交換
  const handleComplete = async () => {

    if (!gameState.drawResult || gameState.isLoading) return

    setGameState({ isLoading: true })

    // 構建列印資料
    const printData = {
      previousSubmission: gameState.drawResult.previousSubmission,
      currentParticipant: {
        participantNumber: gameState.drawResult.submission.participantNumber || 0,
        gridNumber: gameState.drawResult.submission.gridNumber,
        giftType: gameState.giftType || '',
      },
    }

    const printResult = await print(printData)

    if( printResult !== true ){
      setGameState({ isLoading: false }) // 重置 loading 狀態，讓用戶可以再次嘗試
      return
    }

    try {
      // 改為 POST 創建記錄（使用預選的格子）
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

      // 重置流程，回到首頁
      setGameState({
        drawResult: null,
        currentStep: 'welcome',
        giftType: null,
        message: '',
        name: '',
        lineId: '',
        instagram: '',
        isLoading: false,
      })
    } catch (error: any) {
      alert(error.message)
      setGameState({ isLoading: false })
    }
  }

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
              <button
              className="flex h-[64px] w-[200px] items-center justify-center rounded-full bg-[#3E1914] text-[32px] font-bold text-[#DCDD9B]"
              onClick={handleComplete}>
                { gameState.isLoading ? '...通訊中...' : 'GO！'}
              </button>
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
