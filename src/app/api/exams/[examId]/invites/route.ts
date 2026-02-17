export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, generateInviteCode } from '@/lib/auth'

interface Props {
    params: Promise<{ examId: string }>
}

// 초대 코드 목록 조회
export async function GET(request: NextRequest, { params }: Props) {
    try {
        const { examId } = await params
        const user = await getCurrentUser()

        if (!user || (user.role !== 'ADMIN' && user.role !== 'EXAMINER')) {
            return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
        }

        const invites = await prisma.inviteCode.findMany({
            where: { examId },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({ success: true, invites })
    } catch (error) {
        console.error('Get invites error:', error)
        return NextResponse.json({ success: false, error: '목록 조회 중 오류 발생' }, { status: 500 })
    }
}

// 새 초대 코드 생성
export async function POST(request: NextRequest, { params }: Props) {
    try {
        const { examId } = await params
        const user = await getCurrentUser()

        if (!user || (user.role !== 'ADMIN' && user.role !== 'EXAMINER')) {
            return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
        }

        const data = await request.json()
        const candidateName: string | undefined = data?.candidateName

        const invite = await prisma.inviteCode.create({
            data: {
                code: generateInviteCode(),
                examId,
                // 1인 1코드 (중복 참여 불가)
                maxUses: 1,
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                createdById: user.id,
                candidateName: candidateName || null,
            },
        })

        const forwardedProto = request.headers.get('x-forwarded-proto')
        const proto = forwardedProto || 'https'
        const host = request.headers.get('x-forwarded-host') || request.headers.get('host')

        const baseUrl = host ? `${proto}://${host}` : ''
        const nameQuery = candidateName ? `?name=${encodeURIComponent(candidateName)}` : ''
        const inviteUrl = baseUrl ? `${baseUrl}/join/${invite.code}${nameQuery}` : `/join/${invite.code}${nameQuery}`

        return NextResponse.json({ success: true, invite, inviteUrl })
    } catch (error) {
        console.error('Create invite error:', error)
        return NextResponse.json({ success: false, error: '코드 생성 중 오류 발생' }, { status: 500 })
    }
}
