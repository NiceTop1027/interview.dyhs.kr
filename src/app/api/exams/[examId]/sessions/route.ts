export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

interface Props {
    params: Promise<{ examId: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
    try {
        const { examId } = await params
        const user = await getCurrentUser()

        if (!user || (user.role !== 'ADMIN' && user.role !== 'EXAMINER')) {
            return NextResponse.json(
                { success: false, error: '권한이 없습니다.' },
                { status: 403 }
            )
        }

        let sessions
        try {
            sessions = await prisma.examSession.findMany({
                where: { examId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    recordings: {
                        take: 1,
                        orderBy: {
                            createdAt: 'desc'
                        }
                    }
                },
                orderBy: {
                    submittedAt: 'desc',
                },
            })
        } catch (error) {
            // DB 마이그레이션이 아직 적용되지 않은 환경에서 recordings 테이블/관계가 없으면
            // Prisma가 예외를 던질 수 있음. 이 경우 recordings 없이 세션 목록은 제공한다.
            console.error('Fetch sessions error (with recordings):', error)
            sessions = await prisma.examSession.findMany({
                where: { examId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    submittedAt: 'desc',
                },
            })
        }

        return NextResponse.json({
            success: true,
            sessions,
        })
    } catch (error) {
        console.error('Fetch sessions error:', error)
        return NextResponse.json(
            { success: false, error: '세션 목록을 불러오는 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
}
