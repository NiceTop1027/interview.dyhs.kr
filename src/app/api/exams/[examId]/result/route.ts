export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

interface Props {
  params: Promise<{ examId: string }>
}

type ResultResponse = {
  success: true
  session: {
    id: string
    totalScore: number | null
    maxScore: number | null
    percentage: number | null
    isPassed: boolean | null
    timeSpent: number
    cheatingScore: number
    cheatingFlags: string[]
    submittedAt: string | null
    aiEvaluation?: any
    recordingUrl?: string
  }
  exam: {
    title: string
    type: string
    passingScore: number | null
    showResultImmediately: boolean
  }
  answers?: {
    questionId: string
    isCorrect: boolean | null
    score: number | null
    maxScore: number | null
    feedback?: string | null
  }[]
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { examId } = await params
    const user = await getCurrentUser()
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    console.log(`[GET Result] Request for session: ${sessionId}, exam: ${examId}`)

    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 세션 조회
    // 어드민이나 면접관이고 sessionId가 있으면 해당 세션 조회, 아니면 본인 세션 조회
    const isAdmin = user.role === 'ADMIN' || user.role === 'EXAMINER'
    const whereClause: any = { examId }

    if (isAdmin && sessionId) {
      whereClause.id = sessionId
    } else {
      whereClause.userId = user.id
    }

    const session = await prisma.examSession.findFirst({
      where: whereClause,
      include: {
        exam: true,
        user: true,
        recordings: {
          orderBy: { startTime: 'asc' }
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
    })

    console.log(`[GET Result] Session found: ${session?.id}, hasAnalysis: ${!!session?.aiVideoAnalysis}`)

    if (!session) {
      return NextResponse.json(
        { success: false, error: '결과를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 결과 구성
    const result: any = {
      success: true,
      session: {
        id: session.id,
        user: {
          name: session.user.name,
          email: session.user.email,
        },
        totalScore: session.totalScore,
        maxScore: session.maxScore,
        percentage: session.percentage,
        isPassed: session.isPassed,
        timeSpent: session.timeSpent,
        cheatingScore: session.cheatingScore,
        cheatingFlags: session.cheatingFlags,
        submittedAt: session.submittedAt ? session.submittedAt.toISOString() : null,
        recordings: session.recordings,
        aiVideoAnalysis: session.aiVideoAnalysis,
      },
      exam: {
        title: session.exam.title,
        type: session.exam.type,
        passingScore: session.exam.passingScore,
        showResultImmediately: session.exam.showResultImmediately,
      },
    }

    // 즉시 결과 공개이거나 관리자인 경우 문항별 결과 포함
    if (session.exam.showResultImmediately || isAdmin) {
      result.answers = session.answers.map((answer: any) => ({
        questionId: answer.questionId,
        questionContent: answer.question.content,
        isCorrect: answer.isCorrect,
        score: answer.score,
        maxScore: answer.maxScore,
        feedback: answer.feedback,
        audioUrl: answer.audioUrl,
      }))
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Get result error:', error)
    return NextResponse.json(
      { success: false, error: '결과 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
