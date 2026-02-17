export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import type { CheatingType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { env } from '@/lib/env'
import type { QuestionOption } from '@/types'

interface Props {
  params: Promise<{ examId: string }>
}

interface AnswerInput {
  questionId: string
  content?: string
  selectedOptions?: string[]
  audioUrl?: string
  timeSpent?: number
}

interface CheatingLogInput {
  type: CheatingType
  confidence: number
  description?: string
  imageUrl?: string
  timestamp: string | number
}

interface SubmitExamBody {
  sessionId: string
  answers: AnswerInput[]
  cheatingLogs?: CheatingLogInput[]
  cheatingScore?: number
  aiConversation?: unknown
}

const isQuestionOption = (value: unknown): value is QuestionOption => {
  if (!value || typeof value !== 'object') return false
  const option = value as { id?: unknown; content?: unknown; isCorrect?: unknown }
  return (
    typeof option.id === 'string' &&
    typeof option.content === 'string' &&
    typeof option.isCorrect === 'boolean'
  )
}

const getQuestionOptions = (options: unknown): QuestionOption[] => {
  if (!Array.isArray(options)) return []
  return options.filter(isQuestionOption)
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

    const {
      sessionId,
      answers,
      cheatingLogs,
      cheatingScore,
      aiConversation,
    } = (await request.json()) as SubmitExamBody

    // 세션 확인
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        exam: {
          include: {
            questions: {
              include: { question: true },
            },
          },
        },
      },
    })

    if (!session || session.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: '세션을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (session.exam.id !== examId) {
      return NextResponse.json(
        { success: false, error: '시험 정보가 일치하지 않습니다.' },
        { status: 400 }
      )
    }

    if (session.status === 'SUBMITTED' || session.status === 'GRADED') {
      return NextResponse.json(
        { success: false, error: '이미 제출된 시험입니다.' },
        { status: 400 }
      )
    }

    // 소요 시간 계산
    const timeSpent = session.startedAt
      ? Math.floor((Date.now() - session.startedAt.getTime()) / 1000)
      : 0

    // 채점 (객관식만 자동 채점)
    let totalScore = 0
    let maxScore = 0

    const answerPromises = answers.map(async (answer) => {
      const examQuestion = session.exam.questions.find(
        (eq: any) => eq.question.id === answer.questionId
      )
      if (!examQuestion) return null

      const question = examQuestion.question
      maxScore += question.points

      let score = 0
      let isCorrect = false

      // 객관식 자동 채점
      if (
        question.type === 'MULTIPLE_CHOICE' ||
        question.type === 'MULTIPLE_SELECT'
      ) {
        const questionOptions = getQuestionOptions(question.options)
        const correctOptions =
          questionOptions.length > 0
            ? questionOptions
              .filter((opt) => opt.isCorrect)
              .map((opt) => opt.id)
              .sort()
            : null

        const selectedOptions = (answer.selectedOptions || []).slice().sort()

        if (
          correctOptions &&
          correctOptions.length === selectedOptions.length &&
          correctOptions.every((opt, idx) => opt === selectedOptions[idx])
        ) {
          score = question.points
          isCorrect = true
        }
      }

      totalScore += score

      return prisma.answer.upsert({
        where: {
          sessionId_questionId: {
            sessionId,
            questionId: answer.questionId,
          },
        },
        create: {
          sessionId,
          questionId: answer.questionId,
          content: answer.content,
          selectedOptions: answer.selectedOptions || [],
          audioUrl: answer.audioUrl,
          score,
          maxScore: question.points,
          isCorrect,
          timeSpent: answer.timeSpent || 0,
        },
        update: {
          content: answer.content,
          selectedOptions: answer.selectedOptions || [],
          audioUrl: answer.audioUrl,
          score,
          maxScore: question.points,
          isCorrect,
          timeSpent: answer.timeSpent || 0,
        },
      })
    })

    await Promise.all(answerPromises.filter(Boolean))

    // 부정행위 로그 저장
    if (cheatingLogs && cheatingLogs.length > 0) {
      await prisma.cheatingLog.createMany({
        data: cheatingLogs.map((log) => ({
          sessionId,
          type: log.type,
          confidence: log.confidence,
          description: log.description,
          imageUrl: log.imageUrl,
          timestamp: new Date(log.timestamp),
        })),
      })
    }

    // 세션 업데이트
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
    const isPassed = session.exam.passingScore
      ? percentage >= session.exam.passingScore
      : null

    const updatedSession = await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        timeSpent,
        totalScore: totalScore,
        maxScore: maxScore,
        percentage: percentage,
        isPassed: isPassed,
        cheatingScore: cheatingScore || 0,
        cheatingFlags: cheatingLogs?.map((log) => log.type) || [],
      },
      include: {
        user: { select: { name: true } }
      }
    })

    // 실시간 소켓 알림 알림 (관리자에게)
    try {
      const { getIO } = await import('@/lib/socket-io')
      const io = getIO()
      if (io) {
        io.emit('session:finished', {
          sessionId,
          examId,
          userName: updatedSession.user.name,
        })
      }
    } catch (err) {
      console.error('Socket notification error:', err)
    }

    return NextResponse.json({
      success: true,
      session: updatedSession,
      result: {
        totalScore,
        maxScore,
        percentage,
        isPassed,
      },
    })
  } catch (error) {
    console.error('Submit exam error:', error)
    return NextResponse.json(
      { success: false, error: '시험 제출 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
