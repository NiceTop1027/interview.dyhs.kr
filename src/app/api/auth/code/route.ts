export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    let payload: unknown
    try {
      payload = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: '요청 형식이 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    const body = (payload && typeof payload === 'object')
      ? (payload as { code?: unknown; name?: unknown })
      : null

    const code = typeof body?.code === 'string' ? body.code : ''
    const name = typeof body?.name === 'string' ? body.name : ''

    if (!code || !name) {
      return NextResponse.json(
        { success: false, error: '초대 코드와 이름을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 초대 코드 확인
    const inviteCode = await prisma.inviteCode.findUnique({
      where: { code: code.toUpperCase() },
      include: { exam: true },
    })

    if (!inviteCode) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 초대 코드입니다.' },
        { status: 400 }
      )
    }

    if (!inviteCode.isActive) {
      return NextResponse.json(
        { success: false, error: '비활성화된 초대 코드입니다.' },
        { status: 400 }
      )
    }

    if (inviteCode.usedCount >= inviteCode.maxUses) {
      return NextResponse.json(
        { success: false, error: '초대 코드 사용 횟수를 초과했습니다.' },
        { status: 400 }
      )
    }

    if (new Date() > inviteCode.expiresAt) {
      return NextResponse.json(
        { success: false, error: '만료된 초대 코드입니다.' },
        { status: 400 }
      )
    }

    // 시험 상태 확인
    if (inviteCode.exam.status !== 'PUBLISHED' && inviteCode.exam.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { success: false, error: '현재 시험에 참여할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 트랜잭션으로 "초대코드 1회용"을 원자적으로 보장
    const result = await prisma.$transaction(async (tx: any) => {
      // 남은 횟수가 있을 때만 usedCount 증가(레이스 방지)
      const updated = await tx.inviteCode.updateMany({
        where: {
          id: inviteCode.id,
          isActive: true,
          expiresAt: { gt: new Date() },
          usedCount: { lt: inviteCode.maxUses },
        },
        data: { usedCount: { increment: 1 } },
      })

      if (updated.count === 0) {
        throw new Error('INVITE_ALREADY_USED')
      }

      // 사용자 생성
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          role: 'CANDIDATE',
        },
      })

      // 사용 기록 생성
      await tx.inviteCodeUsage.create({
        data: {
          inviteCodeId: inviteCode.id,
          candidateName: name.trim(),
        },
      })

      // 시험 세션 생성 (schema에 @@unique([examId, userId])가 있어서 동일 user 재참여는 막힘)
      const session = await tx.examSession.create({
        data: {
          examId: inviteCode.examId,
          userId: user.id,
          status: 'WAITING',
        },
      })

      return { user, session }
    })

    // JWT 토큰 생성
    const token = createToken({
      userId: result.user.id,
      name: result.user.name,
      role: result.user.role,
    })

    // 쿠키에 토큰 저장
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1일
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        name: result.user.name,
        role: result.user.role,
      },
      examId: inviteCode.examId,
      sessionId: result.session.id,
      exam: {
        id: inviteCode.exam.id,
        title: inviteCode.exam.title,
        type: inviteCode.exam.type,
        duration: inviteCode.exam.duration,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'INVITE_ALREADY_USED') {
      return NextResponse.json(
        { success: false, error: '이미 사용된 초대 코드입니다. 중복 참여는 불가능합니다.' },
        { status: 400 }
      )
    }
    console.error('Code login error:', error)
    return NextResponse.json(
      { success: false, error: '입장 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
