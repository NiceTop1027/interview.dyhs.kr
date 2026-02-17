export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

interface Props {
  params: Promise<{ examId: string }>
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { examId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 세션 확인
    const session = await prisma.examSession.findUnique({
      where: {
        examId_userId: {
          examId,
          userId: user.id,
        },
      },
      include: { exam: true },
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: '세션을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (session.status !== 'WAITING') {
      return NextResponse.json(
        { success: false, error: '이미 시작된 시험입니다.' },
        { status: 400 }
      )
    }

    // IP 주소 및 User-Agent 기록
    const ipAddress = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // 세션 시작
    const updatedSession = await prisma.examSession.update({
      where: { id: session.id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        ipAddress,
        userAgent,
      },
    })

    return NextResponse.json({
      success: true,
      session: updatedSession,
    })
  } catch (error) {
    console.error('Start exam error:', error)
    return NextResponse.json(
      { success: false, error: '시험 시작 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
