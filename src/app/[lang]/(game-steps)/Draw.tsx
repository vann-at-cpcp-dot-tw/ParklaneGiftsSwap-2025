"use client"

const APP_BASE = process.env.NEXT_PUBLIC_APP_BASE || '/'

import { useState } from 'react'

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
  const { gameState, setGameState } = useScopeStore()
  const [isMatchedPreference, setIsMatchedPreference] = useState<boolean | null>(null)

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
        `/api/grids/preview?giftType=${gameState.giftType}&preferSameType=${preferSameType}&excludeLast=2`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '查詢可用格子失敗')
      }

      if (!data.availableGrids || data.availableGrids.length === 0) {
        throw new Error('沒有可用的格子')
      }

      // 從符合用戶偏好的格子中隨機選一個
      const selectedGrid = data.availableGrids[
        Math.floor(Math.random() * data.availableGrids.length)
      ]

      // 構造 DrawResult 物件（使用預估編號）
      const drawResult: DrawResult = {
        success: true,
        matchedPreference: data.matchedPreference,
        userPreference: choice,  // 保存用戶的原始選擇
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

      setIsMatchedPreference(data.matchedPreference)

      if( data.matchedPreference === true ){
        setGameState({ currentStep: 'result' })
      }else{
        setIsMatchedPreference(data.matchedPreference)
      }

    } catch (error: any) {
      alert(error.message)
    } finally {
      setGameState({ isLoading: false })
    }
  }

  return <div className={twMerge('min-h-full flex flex-col justify-center', className)}>

    {
      isMatchedPreference === false && <div className="fixed left-0 top-0 z-[999] flex h-full w-full items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      }}>
        <div className="relative">
          <img className="relative" src="/img/bg_not_matched_alert.svg" alt="" />
          <div className="absolute left-0 top-0 ml-[-24px] mt-[16px] flex h-full w-full flex-col justify-center">
            <img className="mx-auto mb-8 w-[204px]" src="/img/title_sorry.svg" alt="" />
            <div className="text-center text-[24px] text-[#3E1914]">此頻道目前缺人中<br/>宇宙將為你隨機配對</div>
            <div className="my-8 flex justify-center">
              <button
          className="flex h-[64px] w-[176px] items-center justify-center rounded-full bg-[#DCDD9B] text-[32px] font-bold text-[#3E1914] active:bg-[#3E1914] active:text-[#DCDD9B]"
          onClick={()=>{
            setGameState({ currentStep: 'result' })
          }}>OK</button>
            </div>
          </div>
        </div>
      </div>
    }


    <div className="container relative py-5">
      <div className="mx-auto w-full max-w-[531px]">
        <div className="mb-4">
          <img src="/img/title_gift_share.svg" alt="" />
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
            <div className="text-[32px] font-bold">我要</div>
            <div className="text-[20px]">
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
            <div className="text-[32px] font-bold">我不要</div>
            <div className="text-[20px]">
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
            <div className="text-[32px] font-bold">
                交給宇宙選
            </div>
            <div className="text-[20px]">
                （反正命運最會亂玩）
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
}
