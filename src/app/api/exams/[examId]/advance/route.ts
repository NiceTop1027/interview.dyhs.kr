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

        if (!user || (user.role !== 'ADMIN' && user.role !== 'EXAMINER')) {
            return NextResponse.json(
                { success: false, error: '권한이 없습니다.' },
                { status: 403 }
            )
        }

        const { nextIndex } = await request.json()
        const parsedIndex = parseInt(String(nextIndex))

        if (isNaN(parsedIndex)) {
            return NextResponse.json(
                { success: false, error: '유효하지 않은 문항 인덱스입니다.' },
                { status: 400 }
            )
        }

        // @ts-ignore - Prisma types may lag after schema update
        const exam = await (prisma.exam as any).update({
            where: { id: examId },
            data: {
                currentQuestionIndex: parsedIndex,
                currentQuestionStartTime: new Date(),
            },
        })

        return NextResponse.json({
            success: true,
            // @ts-ignore
            currentQuestionIndex: exam.currentQuestionIndex,
        })
    } catch (error) {
        console.error('Advance question error:', error)
        return NextResponse.json(
            { success: false, error: '문항 전환 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}
