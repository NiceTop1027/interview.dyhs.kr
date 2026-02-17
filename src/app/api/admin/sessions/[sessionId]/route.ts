export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params
        const sessionId = resolvedParams.sessionId
        const body = await request.json()
        const { isPassed, status } = body

        const updatedSession = await prisma.examSession.update({
            where: { id: sessionId },
            data: {
                ...(isPassed !== undefined && { isPassed }),
                ...(status !== undefined && { status }),
            }
        })

        return NextResponse.json({
            success: true,
            session: updatedSession
        })
    } catch (error) {
        console.error('Update session error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
