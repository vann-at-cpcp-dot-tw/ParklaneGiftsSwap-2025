"use client"

const APP_BASE = process.env.NEXT_PUBLIC_APP_BASE || '/'

import { useEffect, useState } from 'react'

import { twMerge } from 'tailwind-merge'

import { useScopeStore } from '~/app/[lang]/(home)/scope-store'
import { isEmpty } from '~/lib/utils'

interface IProps {
  id?: string
  className?: string
}

interface IState {
  [key:string]: any
}

export default function MyType(props:IProps){

  const { id, className } = props ?? {}
  const { gameState, setGameState } = useScopeStore()

  return <div className={twMerge('bg-red min-h-full relative flex flex-col justify-center', className)}>
    <img className="pointer-events-none fixed left-0 top-1/2 z-0 w-full -translate-y-1/2" src="/img/question_deco_bg.svg" alt="" />
    <div className="container z-1 relative py-5">
      <div className="mx-auto w-full max-w-[531px]">
        <div className="mb-4">
          <img src="/img/title_my_type.svg" alt="" />
        </div>
        <div className="mb-10 text-[36px] font-bold text-white">我的頻道是</div>

        <div className="mb-[120px] flex w-full items-center justify-center rounded-lg bg-[#3E1914] p-5">
          <img className="relative top-[80px]" src={`/img/my_type_${gameState.giftType}.svg`} alt="" />
          {/* <img className="relative top-[80px]" src={`/img/my_type_C.svg`} alt="" /> */}
        </div>

        <div className="flex justify-center">
          <button
          className="flex h-[64px] w-[176px] items-center justify-center rounded-full bg-[#DCDD9B] text-[32px] font-bold text-[#3E1914] active:bg-[#3E1914] active:text-[#DCDD9B]"
          onClick={()=>{
            setGameState({
              currentStep: 'draw',
            })
          }}>下一步</button>
        </div>
      </div>
    </div>
  </div>
}
