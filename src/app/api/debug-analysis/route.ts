export const dynamic = 'force-dynamic'


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await prisma.examSession.findFirst({
            where: {
                NOT: {
                    aiVideoAnalysis: {
                        equals: null
                    }
                }
            },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                aiVideoAnalysis: true
            }
        })

        if (!session) {
            return NextResponse.json({ message: 'No session with analysis found' })
        }

        return NextResponse.json({
            sessionId: session.id,
            analysis: session.aiVideoAnalysis,
            typeOfAnalysis: typeof session.aiVideoAnalysis,
            isArray: Array.isArray(session.aiVideoAnalysis)
        })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
