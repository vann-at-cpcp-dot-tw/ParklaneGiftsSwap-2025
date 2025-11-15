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

export default function Contact(props:IProps){

  const { id, className } = props ?? {}
  const { gameState, setGameState } = useScopeStore()

  return <div className={twMerge('bg-red min-h-full relative flex flex-col justify-center', className)}>
    <img className="pointer-events-none fixed left-0 top-1/2 z-0 w-full -translate-y-1/2" src="/img/question_deco_bg.svg" alt="" />
    <div className="container z-1 relative py-5">
      <div className="mx-auto w-full max-w-[531px]">
        <div className="mb-4">
          <img src="/img/title_message.svg" alt="" />
        </div>
        <div className="mb-10 text-[36px] font-bold text-white">悄悄留下個人聯繫座標：</div>

        <form
        onSubmit={(e)=>{
          e.preventDefault()
          setGameState({
            currentStep: 'myType',
          })
        }}>
          {
            ['name', 'lineId', 'instagram'].map((formKey, index)=>{
              return <div className="mb-8" key={index}>
                <div className="mb-3 flex items-end justify-between">
                  <img src={`/img/form_title_${formKey}.svg`} alt="" />
                  {
                    formKey === 'name' && <div className="text-[24px] text-white">必填</div>
                  }
                </div>
                <input type="text"
              className="w-full rounded-lg border-none bg-[#DCDD9B] p-4 text-[32px] font-bold text-[#3E1914]"
              style={{
                boxShadow: '8px 8px 4px 0px rgba(0, 0, 0, 0.25)',
              }}
              required={formKey === 'name'}
              value={gameState[formKey] || ''}
              onChange={(e) => {
                setGameState({
                  [formKey]: e.target.value
                })
              }} />
              </div>
            })
          }

          <div className="mb-8 text-center text-[24px] text-white">你的頻率，宇宙已經接收，快來看看你是哪一頻？</div>

          <div className="flex justify-center">
            <button
          className="flex h-[64px] w-[176px] items-center justify-center rounded-full bg-[#DCDD9B] text-[32px] font-bold text-[#3E1914] active:bg-[#3E1914] active:text-[#DCDD9B]">下一步</button>
          </div>

        </form>
      </div>
    </div>
  </div>
}
