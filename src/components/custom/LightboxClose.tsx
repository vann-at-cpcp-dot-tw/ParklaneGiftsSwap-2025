"use client"

import { Suspense, useState, useEffect, useMemo, useCallback } from 'react'

import { twMerge } from 'tailwind-merge'
import { useWindowSize } from "vanns-common-modules/dist/use/react"

import styles from '~/components/custom/styles/index.module.sass'
import { isEmpty } from '~/lib/utils'
import { useStore } from '~/store'

interface IProps {
  id?: string
  className?: string
  color?: string
  onClose?: Function
}

function LightboxClose(props:IProps){

  const store = useStore()
  const viewport = useWindowSize()

  useEffect(()=>{
    function lightboxClickHandler(e:MouseEvent){
      const target = e.target as HTMLElement
      const targetId = target.id
      if( target.dataset.el === 'lightbox' ){
        if( props?.id ){
          store.lightboxClose(props.id)
        }else{
          store.lightboxClose(targetId)
        }
        props?.onClose?.()
      }
    }

    document.body.addEventListener('click', lightboxClickHandler)

    return function(){
      document.body.removeEventListener('click', lightboxClickHandler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.id])

  return <div className={twMerge('close flex justify-end', props?.className)}>
    <div className="btn flex size-10 items-center justify-center"
    onClick={(e)=>{
      const targetId = (e.target as HTMLDivElement)?.closest?.('[data-el="lightbox"]')?.id
      if( props?.id ){
        store.lightboxClose(props.id)
      }else{
        store.lightboxClose(targetId)
      }
      props?.onClose?.()
    }}
    style={{
      marginRight: viewport.width && viewport.width >= 992 ?'-20px' :'-10px',
      marginTop: viewport.width && viewport.width >= 992 ?'-20px' :'-10px',
    }}>
      <i className="bi bi-x-lg text-[28px] font-900 leading-none text-secondary lg:text-[32px]"
      style={{
        color: props.color,
      }}></i>
    </div>
  </div>
}

export default LightboxClose