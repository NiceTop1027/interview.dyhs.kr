export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import type { QuestionOption } from '@/types'

interface Props {
  params: Promise<{ examId: string }>
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

// 시험 정보 조회
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { examId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: {
            question: true,
          },
          orderBy: { order: 'asc' },
        },
        inviteCodes: user.role !== 'CANDIDATE',
        _count: {
          select: {
            sessions: true,
            questions: true,
          }
        }
      },
    })

    if (!exam) {
      return NextResponse.json(
        { success: false, error: '시험을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 응시자인 경우 세션 정보도 함께 조회
    let session = null
    if (user.role === 'CANDIDATE') {
      session = await prisma.examSession.findUnique({
        where: {
          examId_userId: {
            examId,
            userId: user.id,
          },
        },
      })
    }

    // 문항 정보 가공 (응시자에게는 정답 숨김)
    const questions = exam.questions.map((eq: any) => {
      const q = eq.question
      if (user.role === 'CANDIDATE') {
        // 정답 관련 정보 제거
        const {
          correctAnswer: _correctAnswer,
          answerKeywords: _answerKeywords,
          explanation: _explanation,
          ...safeQuestion
        } = q
        void _correctAnswer
        void _answerKeywords
        void _explanation
        // 객관식 옵션에서 정답 여부 제거
        const optionList = getQuestionOptions(safeQuestion.options)

        if (optionList.length > 0) {
          safeQuestion.options = optionList.map((option: any) => ({
            id: option.id,
            content: option.content,
          }))
        }
        return { ...safeQuestion, order: eq.order }
      }
      return { ...q, order: eq.order }
    })

    return NextResponse.json({
      success: true,
      exam: {
        ...exam,
        questions: undefined,
      },
      questions,
      session,
    })
  } catch (error) {
    console.error('Get exam error:', error)
    return NextResponse.json(
      { success: false, error: '시험 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 시험 수정 (관리자/면접관)
export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { examId } = await params
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ADMIN' && user.role !== 'EXAMINER')) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const data = await request.json()

    // 필요한 필드만 추출하여 부분 업데이트 수행
    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.type !== undefined) updateData.type = data.type
    if (data.status !== undefined) updateData.status = data.status
    if (data.duration !== undefined) updateData.duration = parseInt(data.duration) || 0
    if (data.startTime !== undefined) updateData.startTime = data.startTime ? new Date(data.startTime) : null
    if (data.endTime !== undefined) updateData.endTime = data.endTime ? new Date(data.endTime) : null
    if (data.aiInterviewerName !== undefined) updateData.aiInterviewerName = data.aiInterviewerName
    if (data.aiInterviewerPrompt !== undefined) updateData.aiInterviewerPrompt = data.aiInterviewerPrompt
    if (data.maxQuestions !== undefined) updateData.maxQuestions = parseInt(data.maxQuestions) || 0
    if (data.enableCamera !== undefined) updateData.enableCamera = data.enableCamera
    if (data.enableMicrophone !== undefined) updateData.enableMicrophone = data.enableMicrophone
    if (data.enableCheatingDetection !== undefined) updateData.enableCheatingDetection = data.enableCheatingDetection
    if (data.randomizeQuestions !== undefined) updateData.randomizeQuestions = data.randomizeQuestions
    if (data.randomizeOptions !== undefined) updateData.randomizeOptions = data.randomizeOptions
    if (data.preventCopyPaste !== undefined) updateData.preventCopyPaste = data.preventCopyPaste
    if (data.showResultImmediately !== undefined) updateData.showResultImmediately = data.showResultImmediately
    if (data.passingScore !== undefined) updateData.passingScore = parseFloat(data.passingScore) || null
    if (data.isGlobalSync !== undefined) updateData.isGlobalSync = data.isGlobalSync
    if (data.currentQuestionIndex !== undefined) updateData.currentQuestionIndex = parseInt(data.currentQuestionIndex) || 0
    if (data.currentQuestionStartTime !== undefined) updateData.currentQuestionStartTime = data.currentQuestionStartTime ? new Date(data.currentQuestionStartTime) : null

    // @ts-ignore
    const updatedExam = await (prisma.exam as any).update({
      where: { id: examId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      exam: updatedExam,
    })
  } catch (error) {
    console.error('Update exam error:', error)
    return NextResponse.json(
      { success: false, error: '시험 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 시험 삭제 (관리자/면접관)
export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { examId } = await params
    const user = await getCurrentUser()

    if (!user || (user.role !== 'ADMIN' && user.role !== 'EXAMINER')) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { createdById: true },
    })

    if (!exam) {
      return NextResponse.json(
        { success: false, error: '시험을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (user.role !== 'ADMIN' && exam.createdById !== user.id) {
      return NextResponse.json(
        { success: false, error: '본인이 생성한 시험만 삭제할 수 있습니다.' },
        { status: 403 }
      )
    }

    await prisma.exam.delete({
      where: { id: examId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete exam error:', error)
    return NextResponse.json(
      { success: false, error: '시험 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
