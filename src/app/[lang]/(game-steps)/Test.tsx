"use client"

const APP_BASE = process.env.NEXT_PUBLIC_APP_BASE || '/'

import { Suspense, useEffect } from 'react'

import { twMerge } from 'tailwind-merge'

import { useScopeStore } from '~/app/[lang]/(home)/scope-store'
import LinkWithLang from "~/components/custom/LinkWithLang"
import { isEmpty } from '~/lib/utils'

interface IProps {
  id?: string
  className?: string
}

interface IState {
  [key:string]: any
}

export default function Test(props:IProps){

  const { id, className } = props ?? {}
  const {state:gameState, setState:setGameState} = useScopeStore()
  const handleSelectType = (type: 'A' | 'B' | 'C') => {
    setGameState({
      giftType: type,
      currentStep: 'message',
    })
  }


  useEffect(()=>{
    console.log(1111, gameState)
  }, [])

  return <div className={twMerge('', className)}>
    <div style={{ padding: '20px' }}>
      <h2>選擇你的禮物類型（簡化版心理測驗）</h2>
      <div style={{ marginTop: '20px' }}>
        <button
              onClick={() => handleSelectType('A')}
              style={{ margin: '10px', padding: '20px', fontSize: '20px' }}
        >
              類型 A
        </button>
        <button
              onClick={() => handleSelectType('B')}
              style={{ margin: '10px', padding: '20px', fontSize: '20px' }}
        >
              類型 B
        </button>
        <button
              onClick={() => handleSelectType('C')}
              style={{ margin: '10px', padding: '20px', fontSize: '20px' }}
        >
              類型 C
        </button>
      </div>
    </div>
  </div>
}
