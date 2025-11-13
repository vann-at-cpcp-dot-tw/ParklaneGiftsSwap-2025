'use client'

import { useState } from 'react'

interface IProps {
  onValidated: () => void
}

export default function Guard(props: IProps) {
  const { onValidated } = props

  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: inputValue }),
      })

      const data = await response.json()

      if (data.success) {
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

  return <main className="flex h-full flex-col">
    <div className="container flex justify-center pt-5">
      <img src="img/guard_deco_1.svg" alt="" />
    </div>

    <form
        className="container flex grow flex-col items-center justify-center py-5"
        onSubmit={handleSubmit}
    >
      <img className="mb-10" src="img/guard_logo.svg" alt="" />
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
          <img src="img/btn_go.svg" alt="" />
        </button>
      </div>
    </form>

    <div className="container flex justify-center pb-5">
      <img src="img/guard_deco_1.svg" alt="" />
    </div>
  </main>
}
