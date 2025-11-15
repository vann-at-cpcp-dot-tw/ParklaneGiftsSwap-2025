"use client"

const APP_BASE = process.env.NEXT_PUBLIC_APP_BASE || '/'

import { useEffect, useState } from 'react'

import { twMerge } from 'tailwind-merge'

import { useScopeStore } from '~/app/[lang]/(home)/scope-store'
import { isEmpty, padLeft} from '~/lib/utils'

interface IProps {
  id?: string
  className?: string
}

interface IState {
  [key:string]: any
}

export default function Test(props:IProps){

  const { id, className } = props ?? {}
  const {gameState, setGameState} = useScopeStore()

  const [nextParticipantNo, setNextParticipantNo] = useState<number | null>(null)

  useEffect(() => {
    const fetchNextParticipantNo = async () => {
      try {
        const response = await fetch('/api/submissions/next-number')
        const data = await response.json()
        if (data.success) {
          setNextParticipantNo(data.nextRealParticipantNo)
        }
      } catch (error) {
        console.error('Failed to fetch participant number:', error)
      }
    }

    fetchNextParticipantNo()
  }, [])

  return <div className={twMerge('h-full flex flex-col', className)}>
    <div className="container relative mt-8">
      <img className="absolute left-0 top-0 z-0" src="/img/welcome_deco_1.svg" alt="" />
      <div className="z-1 relative flex h-[518px] w-full flex-col justify-end text-center">
        <div className="text-[20px]">歡迎來到</div>
        <div className="mb-1 text-[48px] font-bold">《禮物交易<span className="text-[36px]">（交友）</span>所》</div>
        <div className="mb-1 text-[20px]">讓禮物替你發送訊號找到同頻道的人</div>
        <div className="-mb-3 text-[64px] font-bold text-[#DCDD9B]">
          NO.{nextParticipantNo !== null ? padLeft(String(nextParticipantNo), 5) : '-----'}
        </div>
      </div>
    </div>
    <div className="container grow bg-red text-center">
      <div className="mb-6 text-[20px] text-[#DCDD9B]">參賽者</div>
      <div className="mb-10 text-[24px] font-bold text-white">
        地球上有 69.647 億人，要撞見對頻的人<br/>
        比抽中頭獎還難<br/>
        <br/>
        有人說，相遇是千萬分之一的奇蹟<br/>
        但在這裡，只要一份禮物<br/>
        就能開啟一場不可思議的相遇<br/>
      </div>
      <div className="flex justify-center">
        <button
        className="flex h-[64px] w-[176px] items-center justify-center rounded-full bg-[#DCDD9B] text-[32px] font-bold text-[#3E1914] active:bg-[#3E1914] active:text-[#DCDD9B]"
        onClick={()=>{
          setGameState({
            currentStep: 'test',
          })
        }}>開始</button>
      </div>
    </div>
  </div>
}
