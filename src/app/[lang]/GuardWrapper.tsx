'use client'

import { useState } from 'react'

import Guard from './(game-steps)/Guard'

interface IProps {
  children: React.ReactNode
}

export default function GuardWrapper(props: IProps) {
  const { children } = props

  // 簡單的內存狀態，刷新頁面後會重置
  const [isValidated, setIsValidated] = useState(false)

  const handleValidated = () => {
    setIsValidated(true)
  }

  // 未驗證，顯示 Guard
  if (!isValidated) {
    return <Guard onValidated={handleValidated} />
  }

  // 已驗證，顯示 children
  return <>{children}</>
}
