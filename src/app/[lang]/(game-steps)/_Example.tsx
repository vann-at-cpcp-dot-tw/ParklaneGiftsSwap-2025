"use client"

const APP_BASE = process.env.NEXT_PUBLIC_APP_BASE || '/'

import { useEffect } from 'react'

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

export default function Test(props:IProps){

  const { id, className } = props ?? {}
  const { gameState, setGameState } = useScopeStore()

  return <div className={twMerge('', className)}>
  </div>
}
