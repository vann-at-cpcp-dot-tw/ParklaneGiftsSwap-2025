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

export default function Message(props:IProps){

  const { id, className } = props ?? {}
  const { gameState, setGameState } = useScopeStore()
  const [isComposing, setIsComposing] = useState(false)

  return <div className={twMerge('bg-red min-h-full relative flex flex-col justify-center', className)}>
    <img className="pointer-events-none fixed left-0 top-1/2 z-0 w-full -translate-y-1/2" src="/img/question_deco_bg.svg" alt="" />
    <div className="container z-1 relative py-5">
      <div className="mx-auto w-full max-w-[531px]">
        <div className="mb-4">
          <img src="/img/title_message.svg" alt="" />
        </div>

        <div className="mb-14 text-[36px] font-bold text-white">
          在這裡寫下<br/>
          你想對收到禮物的幸運星<br/>
          一句祝福的話
        </div>

        <form
        onSubmit={(e)=>{
          e.preventDefault()
          setGameState({
            currentStep: 'contact',
          })
        }}>
          <div className="mb-16">
            <div className="mb-4">
              <input type="text"
          className="w-full rounded-lg border-none bg-[#DCDD9B] p-4 text-[32px] font-bold text-[#3E1914]"
          required
          style={{
            boxShadow: '8px 8px 4px 0px rgba(0, 0, 0, 0.25)',
          }}
          value={gameState.message || ''}
          maxLength={20}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={(e) => {
            setIsComposing(false)
            const value = (e.target as HTMLInputElement).value
            setGameState({
              message: value.slice(0, 20)
            })
          }}
          onChange={(e) => {
            if (isComposing) {
              // Composing 期間允許輸入，不限制長度
              setGameState({
                message: e.target.value
              })
            } else {
              // 非 Composing 時限制長度
              setGameState({
                message: e.target.value.slice(0, 20)
              })
            }
          }}
              />
            </div>
            <div className="flex justify-between text-[24px] text-white">
              <div>限 20 個字</div>
              <div><span>{ gameState.message.length > 20 ?'⚠️' :''}</span> { gameState.message.length } / 20</div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
          className="flex h-[64px] w-[176px] items-center justify-center rounded-full bg-[#DCDD9B] text-[32px] font-bold text-[#3E1914] active:bg-[#3E1914] active:text-[#DCDD9B]">下一步</button>
          </div>
        </form>
      </div>
    </div>
  </div>
}
