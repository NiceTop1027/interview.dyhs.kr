import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

interface Props {
    params: Promise<{ examId: string; questionId: string }>
}

// 시험에서 문항 삭제
export async function DELETE(request: NextRequest, { params }: Props) {
    try {
        const { examId, questionId } = await params
        const user = await getCurrentUser()

        if (!user || (user.role !== 'ADMIN' && user.role !== 'EXAMINER')) {
            return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
        }

        // ExamQuestion 관계 삭제
        await prisma.examQuestion.deleteMany({
            where: {
                examId,
                questionId,
            },
        })

        // (참고: Question 자체는 Question Bank 기능 등이 있을 수 있으므로 여기서는 관계만 끊음)
        // 만약 Question 자체를 삭제하고 싶다면 추가 로직 필요

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete exam question error:', error)
        return NextResponse.json({ success: false, error: '삭제 중 오류 발생' }, { status: 500 })
    }
}

// 문항 정보 수정
export async function PUT(request: NextRequest, { params }: Props) {
    try {
        const { questionId } = await params
        const user = await getCurrentUser()

        if (!user || (user.role !== 'ADMIN' && user.role !== 'EXAMINER')) {
            return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
        }

        const data = await request.json()

        const updated = await prisma.question.update({
            where: { id: questionId },
            data: {
                type: data.type,
                content: data.content,
                options: data.options,
                correctAnswer: data.correctAnswer,
                points: parseFloat(data.points) || 10,
                difficulty: parseInt(data.difficulty) || 1,
            },
        })

        return NextResponse.json({ success: true, question: updated })
    } catch (error) {
        console.error('Update question error:', error)
        return NextResponse.json({ success: false, error: '수정 중 오류 발생' }, { status: 500 })
    }
}
