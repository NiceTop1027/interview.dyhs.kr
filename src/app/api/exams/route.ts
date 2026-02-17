export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, generateInviteCode } from '@/lib/auth'

// 시험 목록 조회
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    if (user.role !== 'ADMIN' && user.role !== 'EXAMINER') {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const exams = await prisma.exam.findMany({
      where:
        user.role === 'ADMIN'
          ? {}
          : { createdById: user.id },
      include: {
        _count: {
          select: {
            sessions: true,
            questions: true,
            inviteCodes: true,
          },
        },
        inviteCodes: {
          select: {
            code: true,
            isActive: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        sessions: {
          select: {
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 통계 계산
    const examsWithStats = exams.map((exam: any) => {
      const submitted = exam.sessions.filter((s: any) => s.status === 'SUBMITTED' || s.status === 'GRADED').length
      const inProgress = exam.sessions.filter((s: any) => s.status === 'IN_PROGRESS').length
      const waiting = exam.sessions.filter((s: any) => s.status === 'WAITING').length

      return {
        ...exam,
        sessions: undefined,
        stats: {
          totalCandidates: exam._count.sessions,
          submitted,
          inProgress,
          waiting,
          questionCount: exam._count.questions,
        },
        inviteCodes: exam.inviteCodes,
      }
    })

    return NextResponse.json({
      success: true,
      exams: examsWithStats,
    })
  } catch (error) {
    console.error('Get exams error:', error)
    return NextResponse.json(
      { success: false, error: '시험 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 시험 생성
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    if (user.role !== 'ADMIN' && user.role !== 'EXAMINER') {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const data = await request.json()

    const exam = await prisma.exam.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type || 'EXAM',
        status: 'DRAFT',
        duration: data.duration || 60,
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime: data.endTime ? new Date(data.endTime) : null,
        aiInterviewerName: data.aiInterviewerName || '면접관',
        aiInterviewerPrompt: data.aiInterviewerPrompt,
        maxQuestions: data.maxQuestions || 10,
        enableCamera: data.enableCamera ?? true,
        enableMicrophone: data.enableMicrophone ?? true,
        enableCheatingDetection: data.enableCheatingDetection ?? true,
        randomizeQuestions: data.randomizeQuestions ?? true,
        randomizeOptions: data.randomizeOptions ?? true,
        preventCopyPaste: data.preventCopyPaste ?? true,
        showResultImmediately: data.showResultImmediately ?? false,
        passingScore: data.passingScore,
        createdById: user.id,
      },
    })

    // 기본 초대 코드 생성
    await prisma.inviteCode.create({
      data: {
        code: generateInviteCode(),
        examId: exam.id,
        maxUses: 100,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
        createdById: user.id,
      },
    })

    const examWithInvite = await prisma.exam.findUnique({
      where: { id: exam.id },
      include: {
        inviteCodes: {
          select: { code: true },
          take: 1
        },
        _count: {
          select: { questions: true, sessions: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      exam: examWithInvite,
    })
  } catch (error) {
    console.error('Create exam error:', error)
    return NextResponse.json(
      { success: false, error: '시험 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
