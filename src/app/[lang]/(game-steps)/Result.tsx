"use client"

const APP_BASE = process.env.NEXT_PUBLIC_APP_BASE || '/'

import { twMerge } from 'tailwind-merge'

import { useScopeStore } from '~/app/[lang]/(home)/scope-store'
import { isEmpty } from '~/lib/utils'



interface IProps {
  id?: string
  className?: string
}

export default function Result(props: IProps) {
  const { id, className } = props ?? {}
  const { gameState, setGameState, print } = useScopeStore()



  // 完成交換
  const handleComplete = async () => {
    if (!gameState.drawResult) return

    setGameState({ isLoading: true })

    try {
      // 改為 POST 創建記錄（使用預選的格子）
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftType: gameState.giftType,
          message: gameState.message || '',
          name: gameState.name,
          lineId: gameState.lineId || '',
          instagram: gameState.instagram || '',
          assignedGridId: gameState.drawResult.submission.assignedGridId, // 使用預選的格子
          preferSameType: gameState.drawResult.matchedPreference ? true : null, // 保留偏好記錄
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // 處理格子已被佔用的情況
        if (data.retryable) {
          alert('格子已被佔用（可能其他裝置搶先），請重新抽選')
          setGameState({ drawResult: null, currentStep: 'draw', isLoading: false })
          return
        }
        throw new Error(data.error || '完成交換失敗')
      }

      alert('交換完成！')
      // 重置流程，回到首頁
      setGameState({
        drawResult: null,
        currentStep: 'welcome',
        giftType: null,
        message: '',
        name: '',
        lineId: '',
        instagram: '',
        isLoading: false,
      })
    } catch (error: any) {
      alert(error.message)
      setGameState({ isLoading: false })
    }
  }


  return <div style={{ padding: '20px' }}>
    <h2>抽獎結果</h2>
    <div style={{ marginTop: '20px' }}>
      <p>你的類型：{gameState.drawResult.submission.giftType}</p>
      <p>抽到的格子：{gameState.drawResult.submission.gridNumber} 號</p>
      <p>是否符合偏好：{gameState.drawResult.matchedPreference ? '是' : '否（已降級為隨機）'}</p>

      <hr style={{ margin: '20px 0' }} />

      <h3>上一個參加者的資訊（列印用）</h3>
      {gameState.drawResult.previousSubmission ? (
        <div>
          <p>編號：{gameState.drawResult.previousSubmission.participantNumber}</p>
          <p>姓名：{gameState.drawResult.previousSubmission.name}</p>
          <p>類型：{gameState.drawResult.previousSubmission.giftType}</p>
          <p>留言：{gameState.drawResult.previousSubmission.message}</p>
          {gameState.drawResult.previousSubmission.lineId && (
            <p>LINE ID：{gameState.drawResult.previousSubmission.lineId}</p>
          )}
          {gameState.drawResult.previousSubmission.instagram && (
            <p>Instagram：{gameState.drawResult.previousSubmission.instagram}</p>
          )}
        </div>
      ) : (
        <p>這是第一個禮物（工作人員預設禮物）</p>
      )}

      <hr style={{ margin: '20px 0' }} />

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
              onClick={handleComplete}
              disabled={gameState.isLoading}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: gameState.isLoading ? 'not-allowed' : 'pointer',
              }}
        >
          {gameState.isLoading ? '處理中...' : '確認完成交換'}
        </button>

        <button
              onClick={print}
              disabled={gameState.isLoading || !gameState.drawResult.previousSubmission}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: gameState.isLoading || !gameState.drawResult.previousSubmission ? 'not-allowed' : 'pointer',
                opacity: !gameState.drawResult.previousSubmission ? 0.5 : 1,
              }}
        >
          {gameState.isLoading ? '列印中...' : '重新列印小卡'}
        </button>

        <button
              onClick={() => window.print()}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                backgroundColor: '#9E9E9E',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
        >
              瀏覽器列印
        </button>
      </div>
    </div>
  </div>
}
