"use client"

import { Suspense, useRef, useReducer, useEffect } from 'react'

import { useRouter } from 'next/navigation'
import { twMerge } from 'tailwind-merge'
import { useWindowSize } from "vanns-common-modules/dist/use/react"

import { useStore } from '~/store'


interface IProps {
  className?: string
}
interface IState {
  footerHeight: number
}

function Footer(props:IProps){
  const store = useStore()
  const router = useRouter()
  const viewport = useWindowSize()
  const footerRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useReducer((state:IState, updateState:{})=>({...state, ...updateState}), {
    // init state
    footerHeight: 0,
  })

  useEffect(()=>{
    setState({
      footerHeight: footerRef.current?.clientHeight || 0,
    })
  }, [viewport.width, viewport.height, footerRef?.current?.clientHeight])

  return <Suspense fallback={null}>
    <div className={twMerge('relative', props?.className)} ref={footerRef}>
      <div className="container flex justify-center py-5">::: Footer :::</div>
    </div>
  </Suspense>
}

export default Footer