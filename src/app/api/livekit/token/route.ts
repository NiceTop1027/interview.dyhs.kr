export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { roomName } = await request.json()
    if (!roomName) {
      return NextResponse.json(
        { success: false, error: '방 이름이 필요합니다.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { success: false, error: 'LiveKit 설정이 필요합니다.' },
        { status: 500 }
      )
    }

    // AccessToken 생성
    const at = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: user.name,
    })

    // 권한 설정
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })

    const token = await at.toJwt()

    return NextResponse.json({
      success: true,
      token,
    })
  } catch (error) {
    console.error('LiveKit token error:', error)
    return NextResponse.json(
      { success: false, error: '토큰 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
