export const dynamic = 'force-dynamic'


import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

interface Props {
    params: Promise<{ examId: string; inviteId: string }>
}

// 초대 코드 삭제
export async function DELETE(request: NextRequest, { params }: Props) {
    try {
        const { inviteId } = await params
        const user = await getCurrentUser()

        if (!user || (user.role !== 'ADMIN' && user.role !== 'EXAMINER')) {
            return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
        }

        await prisma.inviteCode.delete({
            where: { id: inviteId },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete invite error:', error)
        return NextResponse.json({ success: false, error: '코드 삭제 중 오류 발생' }, { status: 500 })
    }
}

// 초대 코드 상태 변경 (활성/비활성)
export async function PATCH(request: NextRequest, { params }: Props) {
    try {
        const { inviteId } = await params
        const user = await getCurrentUser()

        if (!user || (user.role !== 'ADMIN' && user.role !== 'EXAMINER')) {
            return NextResponse.json({ success: false, error: '권한이 없습니다.' }, { status: 403 })
        }

        const { isActive } = await request.json()

        const invite = await prisma.inviteCode.update({
            where: { id: inviteId },
            data: { isActive },
        })

        return NextResponse.json({ success: true, invite })
    } catch (error) {
        console.error('Update invite error:', error)
        return NextResponse.json({ success: false, error: '코드 수정 중 오류 발생' }, { status: 500 })
    }
}
