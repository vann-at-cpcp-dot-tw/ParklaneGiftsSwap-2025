import { NextResponse } from 'next/server'

// 從環境變數讀取驗證碼（必須設定，否則拒絕訪問）
const CORRECT_PASSWORD = process.env.ADMIN_PASSWORD

if (!CORRECT_PASSWORD) {
  console.error('❌ 錯誤：未設定 ADMIN_PASSWORD 環境變數')
}

/**
 * 驗證密碼
 * POST /api/auth/validate
 *
 * Request body: { password: string }
 * Response: { success: boolean }
 */
export async function POST(request: Request) {
  try {
    // 檢查環境變數是否設定
    if (!CORRECT_PASSWORD) {
      return NextResponse.json(
        { success: false, error: '伺服器配置錯誤：未設定管理員密碼' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { password } = body

    // 驗證密碼
    if (password === CORRECT_PASSWORD) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    )
  }
}
