"use client"

import { Suspense, useReducer, useEffect } from 'react'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { twMerge } from 'tailwind-merge'
import { useWindowSize } from "vanns-common-modules/dist/use/react"
import { useDomNodeSize } from "vanns-common-modules/dist/use/react"

import LinkWithLang from "~/components/custom/LinkWithLang"
import { useStore } from '~/store'

interface IProps {
  className?: string
}

interface IState {}

interface IMenuNode {
  label: string
  href?: string
  hrefTarget?: string
  onClick?: Function
  children?: IMenuNode[]
}

const menu = [
  {
    label: 'ABOUT ME',
    href: '/about',
  },
  {
    label: 'CONTACT',
    href: '/contact',
  },
]

function Header(props:IProps){
  const store = useStore()
  const { size:headerSize, setNode:setHeaderNode } = useDomNodeSize()
  const router = useRouter()
  const viewport = useWindowSize()
  const [state, setState] = useReducer((state:IState, updateState:{})=>({...state, ...updateState}), {
    // init state
  })

  useEffect(()=>{
    // document.body.style.paddingTop = `${headerSize.height}px`
    (document.getElementById('app') as HTMLDivElement).style.paddingTop = `${headerSize.height}px`
  }, [headerSize.height])


  return <Suspense fallback={null}>
    <div className={twMerge('fixed left-0 top-0 z-[100] w-full', props?.className)}
    ref={setHeaderNode}>
      <div className="container py-7">
        <div className="row items-center">
          <div className="col-auto mr-auto">
            <LinkWithLang href="/">
              <Image src="/next.svg" width={90} height={90} alt="" />
            </LinkWithLang>
          </div>
          {
            menu.map((node:IMenuNode, index:number)=>{
              return <LinkWithLang href={node.href} target={node?.hrefTarget || '_self'} key={index}>
                <div className="col-auto hidden lg:block">
                  <div className="btn-scaleUp font-bold">{ node.label }</div>
                </div>
              </LinkWithLang>
            })
          }
        </div>
      </div>
    </div>
  </Suspense>
}

export default Header