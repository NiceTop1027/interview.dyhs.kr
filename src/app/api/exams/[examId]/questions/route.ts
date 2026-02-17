export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

interface Props {
    params: Promise<{ examId: string }>
}

// 시험 문항 목록 조회
export async function GET(request: NextRequest, { params }: Props) {
    try {
        const { examId } = await params
        const user = await getCurrentUser()

        if (!user || (user.role !== 'ADMIN' && user.role !== 'EXAMINER')) {
            return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
        }

        const examQuestions = await prisma.examQuestion.findMany({
            where: { examId },
            include: { question: true },
            orderBy: { order: 'asc' },
        })

        return NextResponse.json({ success: true, questions: examQuestions })
    } catch (error) {
        return NextResponse.json({ success: false, error: '조회 중 오류 발생' }, { status: 500 })
    }
}

// 새 문항 추가 및 시험에 연결
export async function POST(request: NextRequest, { params }: Props) {
    try {
        const { examId } = await params
        const user = await getCurrentUser()

        if (!user || (user.role !== 'ADMIN' && user.role !== 'EXAMINER')) {
            return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
        }

        const data = await request.json()

        // 1. Question 생성
        const question = await prisma.question.create({
            data: {
                type: data.type || 'MULTIPLE_CHOICE',
                content: data.content,
                options: data.options || [],
                correctAnswer: data.correctAnswer,
                points: parseFloat(data.points) || 10,
                difficulty: parseInt(data.difficulty) || 1,
                createdById: user.id,
            },
        })

        // 2. ExamQuestion 연결
        const lastQuestion = await prisma.examQuestion.findFirst({
            where: { examId },
            orderBy: { order: 'desc' },
        })
        const order = lastQuestion ? lastQuestion.order + 1 : 0

        const examQuestion = await prisma.examQuestion.create({
            data: {
                examId,
                questionId: question.id,
                order,
            },
            include: { question: true },
        })

        return NextResponse.json({ success: true, question: examQuestion })
    } catch (error) {
        console.error('Create question error:', error)
        return NextResponse.json({ success: false, error: '문항 생성 중 오류 발생' }, { status: 500 })
    }
}
