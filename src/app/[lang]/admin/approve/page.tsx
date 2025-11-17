'use client'

import { useEffect, useState } from 'react'

import { usePrint, type PrintData } from '~/hooks/usePrint'

interface PendingSubmission {
  id: number
  giftType: string
  message: string
  name: string
  lineId: string | null
  instagram: string | null
  gridNumber: number
  assignedGridId: number
  previousSubmission: {
    participantNumber: number
    realParticipantNo: number | null
    giftType: string
    message: string
    name: string
    lineId: string | null
    instagram: string | null
  } | null
  matchedPreference: boolean
  createdAt: string
}

export default function ApprovePage() {
  const [pendingList, setPendingList] = useState<PendingSubmission[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { print, PrintTemplate } = usePrint()

  // 獲取待審核列表
  const fetchPendingList = async () => {
    try {
      const response = await fetch('/api/admin/pending')
      const data = await response.json()

      if (response.ok) {
        setPendingList(data.pendingSubmissions || [])
      }
    } catch (error) {
      console.error('獲取待審核列表失敗:', error)
    }
  }

  // 自動輪詢刷新
  useEffect(() => {
    fetchPendingList()
    const interval = setInterval(fetchPendingList, 2000) // 每 2 秒刷新
    return () => clearInterval(interval)
  }, [])

  // 審核通過
  const handleApprove = async (pending: PendingSubmission) => {

    setIsLoading(true)

    try {

      // 1. 先列印
      if (pending.previousSubmission) {
        const printData: PrintData = {
          previousSubmission: pending.previousSubmission,
          currentParticipant: {
            participantNumber: 0, // 暫時使用 0，列印後會從 API 獲取真實編號
            gridNumber: pending.gridNumber,
            giftType: pending.giftType,
          },
        }

        const printResult = await print(printData)

        if (printResult !== true) {
          alert('列印失敗，請重試')
          setIsLoading(false)
          return
        }
      }

      // 2. 列印成功後，呼叫 API 審核通過
      const response = await fetch(`/api/admin/pending/${pending.id}/approve`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '審核失敗')
      }

      alert(
        `審核通過！\n參加者編號：${data.submission.participantNumber}\n格子：${data.submission.gridNumber}`
      )

      // 刷新列表
      await fetchPendingList()
    } catch (error: any) {
      alert(`審核失敗：${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 審核拒絕
  const handleReject = async (pending: PendingSubmission) => {

    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/pending/${pending.id}/reject`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '拒絕失敗')
      }

      // 刷新列表
      await fetchPendingList()
    } catch (error: any) {
      alert(`拒絕失敗：${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px' }}>📋 待審核申請</h1>

      {pendingList.length === 0 ? (
        <div
          style={{
            padding: '60px',
            textAlign: 'center',
            backgroundColor: '#f0f0f0',
            borderRadius: '8px',
            color: '#666',
          }}
        >
          <p style={{ fontSize: '18px' }}>目前沒有待審核的申請</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {pendingList.map((pending) => (
            <div
              key={pending.id}
              style={{
                border: '2px solid #ddd',
                padding: '20px',
                borderRadius: '8px',
                backgroundColor: '#fff',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* 左側：當前參加者資訊 */}
                <div>
                  <h2 style={{ marginBottom: '15px', color: '#2196F3' }}>
                    當前參加者
                  </h2>
                  <div style={{ lineHeight: '1.8' }}>
                    <p>
                      <strong>姓名：</strong>
                      {pending.name}
                    </p>
                    <p>
                      <strong>禮物類型：</strong>
                      {pending.giftType}
                    </p>
                    <p>
                      <strong>抽到格子：</strong>
                      {pending.gridNumber}
                    </p>
                    <p>
                      <strong>留言：</strong>
                      {pending.message || '（無）'}
                    </p>
                    <p>
                      <strong>LINE ID：</strong>
                      {pending.lineId || '（未提供）'}
                    </p>
                    <p>
                      <strong>Instagram：</strong>
                      {pending.instagram || '（未提供）'}
                    </p>
                    <p>
                      <strong>符合偏好：</strong>
                      {pending.matchedPreference ? '✅ 是' : '❌ 否'}
                    </p>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                      <strong>申請時間：</strong>
                      {new Date(pending.createdAt).toLocaleString('zh-TW')}
                    </p>
                  </div>
                </div>

                {/* 右側：上一位參加者資訊 */}
                <div>
                  <h2 style={{ marginBottom: '15px', color: '#4CAF50' }}>
                    上一位參加者（將交換到的禮物）
                  </h2>
                  {pending.previousSubmission ? (
                    <div style={{ lineHeight: '1.8' }}>
                      <p>
                        <strong>姓名：</strong>
                        {pending.previousSubmission.name}
                      </p>
                      <p>
                        <strong>禮物類型：</strong>
                        {pending.previousSubmission.giftType}
                      </p>
                      <p>
                        <strong>編號：</strong>
                        {pending.previousSubmission.participantNumber}
                      </p>
                      <p>
                        <strong>留言：</strong>
                        {pending.previousSubmission.message || '（無）'}
                      </p>
                      <p>
                        <strong>LINE ID：</strong>
                        {pending.previousSubmission.lineId || '（未提供）'}
                      </p>
                      <p>
                        <strong>Instagram：</strong>
                        {pending.previousSubmission.instagram || '（未提供）'}
                      </p>
                    </div>
                  ) : (
                    <p style={{ color: '#999' }}>（這是第一個放入此格子的禮物）</p>
                  )}
                </div>
              </div>

              {/* 操作按鈕 */}
              <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <button
                  onClick={() => handleApprove(pending)}
                  disabled={isLoading}
                  style={{
                    padding: '12px 30px',
                    fontSize: '16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  {isLoading ? '處理中...' : '✅ 審核通過（列印小票）'}
                </button>

                <button
                  onClick={() => handleReject(pending)}
                  disabled={isLoading}
                  style={{
                    padding: '12px 30px',
                    fontSize: '16px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  {isLoading ? '處理中...' : '❌ 拒絕申請'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 說明區 */}
      <div
        style={{
          marginTop: '60px',
          padding: '20px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
        }}
      >
        <h2>使用說明</h2>
        <ul style={{ lineHeight: '1.8' }}>
          <li>
            <strong>審核通過</strong>：點擊後會先列印小票，然後將申請寫入正式記錄
          </li>
          <li>
            <strong>拒絕申請</strong>：直接刪除此申請，不留記錄（例如禮物不合格）
          </li>
          <li>此頁面每 3 秒自動刷新，當 iPad 端有新申請時會自動顯示</li>
          <li>
            ⚠️ 審核通過後，iPad 端會自動跳回首頁，可繼續下一位參加者的遊戲
          </li>
        </ul>
      </div>

      {/* 列印模板（隱藏） */}
      {PrintTemplate}
    </div>
  )
}
