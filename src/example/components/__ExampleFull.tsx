"use client"
const APP_BASE = process.env.NEXT_PUBLIC_APP_BASE || '/'

import { Suspense, forwardRef, useState, useRef, useReducer, useEffect, useMemo, useCallback } from 'react'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Image from "next/image"
import { useRouter } from 'next/navigation'
import { twMerge } from 'tailwind-merge'
import { useWindowSize } from "vanns-common-modules/dist/use/react"

import LinkWithLang from "~/components/custom/LinkWithLang"
import { isEmpty } from '~/lib/utils'
import { useStore } from '~/store'

interface IProps {
  id?: string
  className?: string
}

interface IState {
  [key:string]: any
}

export default function ExampleFull(props:IProps){
  const store = useStore()
  const router = useRouter()
  const viewport = useWindowSize()
  const [state, setState] = useReducer((state:IState, updateState:{})=>({...state, ...updateState}), {
    // init state
  })
  const { id, className } = props ?? {}

  return <Suspense fallback={null}>
    <div className={twMerge('', className)}></div>
  </Suspense>
}
