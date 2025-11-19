'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'guard_validated_at'
const EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 小時

interface IProps {
  onValidated: () => void
}

export default function Guard(props: IProps) {
  const { onValidated } = props

  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true) // 檢查 localStorage 中

  // 檢查 localStorage 是否有有效的驗證
  useEffect(() => {
    const validatedAt = localStorage.getItem(STORAGE_KEY)

    if (validatedAt) {
      const timestamp = parseInt(validatedAt, 10)
      const now = Date.now()

      if (now - timestamp < EXPIRY_MS) {
        // 尚未過期，自動通過
        onValidated()
        return
      } else {
        // 已過期，清除
        localStorage.removeItem(STORAGE_KEY)
      }
    }

    setIsChecking(false)
  }, [onValidated])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: inputValue }),
      })

      const data = await response.json()

      if (data.success) {
        // 儲存驗證時間到 localStorage
        localStorage.setItem(STORAGE_KEY, Date.now().toString())
        onValidated()
      } else {
        alert('驗證失敗')
        setInputValue('')
      }
    } catch (err) {
      alert('驗證失敗')
      setInputValue('')
    } finally {
      setIsLoading(false)
    }
  }

  // 檢查中不顯示任何內容（避免閃爍）
  if (isChecking) {
    return null
  }

  return <main className="flex h-full flex-col">
    <div className="container flex justify-center pt-5">
      <img src="/img/guard_deco_1.svg" alt="" />
    </div>

    <form
        className="container flex grow flex-col items-center justify-center py-5"
        onSubmit={handleSubmit}
    >
      <img className="mb-10" src="/img/guard_logo.svg" alt="" />
      <div className="mb-[60px] text-[36px] font-bold text-red">
          [ 禮物交易 ( 交友 ) 所 ]
      </div>
      <div className="mb-8 flex justify-center">
        <input
            className="w-full max-w-[219px]"
            type="text"
            inputMode="numeric"
            autoFocus
            required
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            style={{
              color: '#3E1914',
              borderBottom: '5px solid #3E1914',
              background: 'none',
              fontSize: '40px',
              fontWeight: 'bold',
            }}
        />
      </div>
      <div className="flex justify-center">
        <button type="submit" disabled={isLoading}>
          <img src="/img/btn_go.svg" alt="" />
        </button>
      </div>
    </form>

    <div className="container flex justify-center pb-5">
      <img src="/img/guard_deco_1.svg" alt="" />
    </div>
  </main>
}
