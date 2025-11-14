import { NextResponse } from 'next/server'

// 硬編碼的正確驗證碼
const CORRECT_PASSWORD = '123456'

/**
 * 驗證密碼
 * POST /api/auth/validate
 *
 * Request body: { password: string }
 * Response: { success: boolean }
 */
export async function POST(request: Request) {
  try {
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
