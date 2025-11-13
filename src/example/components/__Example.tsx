const APP_BASE = process.env.NEXT_PUBLIC_APP_BASE || '/'

import { Suspense } from 'react'

import Image from "next/image"
import { twMerge } from 'tailwind-merge'

import LinkWithLang from "~/components/custom/LinkWithLang"
import { isEmpty } from '~/lib/utils'

interface IProps {
  id?: string
  className?: string
}

interface IState {
  [key:string]: any
}

export default function Example(props:IProps){

  const { id, className } = props ?? {}

  return <Suspense fallback={null}>
    <div className={twMerge('', className)}></div>
  </Suspense>
}
