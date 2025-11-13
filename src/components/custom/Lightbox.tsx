"use client"

import { Suspense, useState, useRef, useEffect, useMemo, useCallback } from 'react'

import { twMerge } from 'tailwind-merge'
import Portal from 'vanns-common-modules/dist/components/react/Portal'
import { useWindowSize } from "vanns-common-modules/dist/use/react"

import styles from '~/components/custom/styles/Lightbox.module.sass'
import { isEmpty } from '~/lib/utils'
import { useStore } from '~/store'

interface IProps {
  id: string
  className?: string
  maxWidth?: string
  children?: React.ReactNode
}

function Lightbox(props:IProps){
  const store = useStore()
  const innerRef = useRef(null)
  const lightboxRef = useRef(null)

  useEffect(()=>{
    if (store.lightbox.length > 0) {
      document.body.classList.add('lb-open')
    }else{
      document.body.classList.remove('lb-open')
    }
  }, [store.lightbox])

  return <>
    {
      store.lightbox.includes(props.id) && <Portal dom={document.body}>
        <div data-el="lightbox"
        className={twMerge(`${styles.lightbox} ${store.lightbox[store.lightbox.length-1] === props.id ?'visible' :'invisible'}`, props?.className)}
        id={props?.id}
        ref={lightboxRef}>
          <div className="inner rounded-2xl" style={{maxWidth: props?.maxWidth}} ref={innerRef}>
            <div className="p-6 lg:p-10">{props?.children}</div>
          </div>
        </div>
      </Portal>
    }
  </>
}

export default Lightbox