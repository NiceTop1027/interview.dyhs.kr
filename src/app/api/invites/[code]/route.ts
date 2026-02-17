export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Props {
    params: Promise<{ code: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
    try {
        const { code } = await params
        const inviteCode = await prisma.inviteCode.findUnique({
            where: { code: code.toUpperCase() },
            select: {
                id: true,
                candidateName: true,
                isActive: true,
                expiresAt: true,
                usedCount: true,
                maxUses: true,
            }
        })

        if (!inviteCode) {
            return NextResponse.json({ success: false, error: '유효하지 않은 초대 코드입니다.' }, { status: 404 })
        }

        return NextResponse.json({ success: true, invite: inviteCode })
    } catch (error) {
        console.error('Get invite error:', error)
        return NextResponse.json({ success: false, error: '초대 코드 조회 중 오류 발생' }, { status: 500 })
    }
}
