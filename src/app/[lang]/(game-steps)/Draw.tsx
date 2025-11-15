"use client"

const APP_BASE = process.env.NEXT_PUBLIC_APP_BASE || '/'

import { flushSync } from 'react-dom'
import { twMerge } from 'tailwind-merge'

import type { DrawResult } from '~/app/[lang]/(home)/page'
import { useScopeStore } from '~/app/[lang]/(home)/scope-store'

interface IProps {
  id?: string
  className?: string
}

export default function Draw(props: IProps) {
  const { id, className } = props ?? {}
  const { gameState, setGameState, print } = useScopeStore()

  const handleChoice = async (choice: 'same' | 'different' | 'random') => {
    // 验证必填字段
    if (!gameState.giftType) {
      alert('請先完成測驗')
      return
    }

    if (!gameState.name || gameState.name.trim() === '') {
      alert('請填寫姓名')
      return
    }

    setGameState({ isLoading: true })

    try {
      // 转换为 API 参数
      const preferSameType =
        choice === 'same' ? 'true' :
          choice === 'different' ? 'false' :
            'null'  // 随机

      // 呼叫 GET API 獲取可用格子列表（不寫入 DB）
      const response = await fetch(
        `/api/grids/preview?giftType=${gameState.giftType}&preferSameType=${preferSameType}`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '查詢可用格子失敗')
      }

      if (!data.availableGrids || data.availableGrids.length === 0) {
        throw new Error('沒有可用的格子')
      }

      // 前端隨機選一個格子
      const selectedGrid = data.availableGrids[
        Math.floor(Math.random() * data.availableGrids.length)
      ]

      // 構造 DrawResult 物件（使用預估編號）
      const drawResult: DrawResult = {
        success: true,
        matchedPreference: data.matchedPreference,
        submission: {
          id: 0,  // 暫時沒有 ID（尚未寫入 DB）
          participantNumber: gameState.estimatedParticipantNo || 0,  // 使用 Welcome 取得的預估編號
          giftType: gameState.giftType,
          assignedGridId: selectedGrid.id,
          gridNumber: selectedGrid.gridNumber,
        },
        previousSubmission: selectedGrid.previousSubmission,
      }

      // 使用 flushSync 強制同步更新 drawResult
      flushSync(() => {
        setGameState({ drawResult })
      })

      // 此時 gameState.drawResult 已經更新完成，可以列印
      const printResult = await print()

      // 最後導轉到 result 頁
      if( printResult === true ){
        setGameState({ currentStep: 'result' })
      }

      // console.log('抽選結果（尚未寫入 DB）:', drawResult)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setGameState({ isLoading: false })
    }
  }

  return <div className={twMerge('bg-red min-h-full flex flex-col justify-center', className)}>
    <div className="container relative py-5">
      <div className="mx-auto w-full max-w-[531px]">
        <div className="mb-4">
          <img src="/img/title_draw.svg" alt="" />
        </div>

        <div className="mb-10 whitespace-nowrap text-[36px] font-bold text-white">你想和「同頻的人」交換禮物嗎？</div>

        <div className="flex flex-col gap-6">
          <button
              className="mb-6 rounded-lg bg-[#DCDD9B] p-6 text-center transition-colors active:bg-[#3E1914] active:text-[#DCDD9B]"
              style={{
                boxShadow: '8px 8px 4px 0px rgba(0, 0, 0, 0.25)',
              }}
              onClick={() => handleChoice('same')}
              disabled={gameState.isLoading}
          >
            <div className="text-[32px] font-bold text-[#3E1914]">我要</div>
            <div className="text-[20px] text-[#3E1914]">
                （想看看宇宙會不會安排雙重共振）
            </div>
          </button>

          <button
              className="mb-6 rounded-lg bg-[#DCDD9B] p-6 text-center transition-colors active:bg-[#3E1914] active:text-[#DCDD9B]"
              style={{
                boxShadow: '8px 8px 4px 0px rgba(0, 0, 0, 0.25)',
              }}
              onClick={() => handleChoice('different')}
              disabled={gameState.isLoading}
          >
            <div className="text-[32px] font-bold text-[#3E1914]">我不要</div>
            <div className="text-[20px] text-[#3E1914]">
                （想挑戰看看反差火花）
            </div>
          </button>

          <button
              className="rounded-lg bg-[#DCDD9B] p-6 text-center transition-colors active:bg-[#3E1914] active:text-[#DCDD9B]"
              style={{
                boxShadow: '8px 8px 4px 0px rgba(0, 0, 0, 0.25)',
              }}
              onClick={() => handleChoice('random')}
              disabled={gameState.isLoading}
          >
            <div className="text-[32px] font-bold text-[#3E1914]">
                交給宇宙選
            </div>
            <div className="text-[20px] text-[#3E1914]">
                （反正命運最會亂玩）
            </div>
          </button>
        </div>

        {
          gameState.isLoading &&
          <div className="mt-8 text-center text-[24px] text-white">
              抽獎中...
          </div>
        }
      </div>
    </div>
  </div>
}
