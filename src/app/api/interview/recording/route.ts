export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { env, uploadConfig } from '@/lib/env'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File
        const sessionId = formData.get('sessionId') as string
        const questionId = formData.get('questionId') as string
        const type = (formData.get('type') as string) || 'CAMERA'

        if (!file || !sessionId) {
            return NextResponse.json({ success: false, error: '필수 파라미터가 누락되었습니다.' }, { status: 400 })
        }

        // 파일 타입 검증
        if (!uploadConfig.allowedRecordingTypes.includes(file.type)) {
            return NextResponse.json({
                success: false,
                error: `허용되지 않는 파일 형식입니다. 허용: ${uploadConfig.allowedRecordingTypes.join(', ')}`
            }, { status: 400 })
        }

        // 파일 크기 검증
        if (file.size > uploadConfig.maxFileSize) {
            return NextResponse.json({
                success: false,
                error: `파일 크기가 너무 큽니다. 최대 ${uploadConfig.maxFileSize / (1024 * 1024)}MB까지 허용됩니다.`
            }, { status: 400 })
        }

        // 파일 확장자 검증
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'webm'
        if (!uploadConfig.allowedExtensions.includes(fileExtension)) {
            return NextResponse.json({
                success: false,
                error: `허용되지 않는 파일 확장자입니다. 허용: ${uploadConfig.allowedExtensions.join(', ')}`
            }, { status: 400 })
        }

        // 세션 확인
        const session = await prisma.examSession.findUnique({
            where: { id: sessionId },
        })

        if (!session || session.userId !== user.id) {
            return NextResponse.json({ success: false, error: '세션을 찾을 수 없거나 권한이 없습니다.' }, { status: 404 })
        }

        // 파일 저장 경로 설정
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // 안전한 파일명 생성 (UUID 사용으로 경로 조작 방지)
        const safeFileName = `${uuidv4()}.${fileExtension}`
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'recordings')
        const relativePath = `/uploads/recordings/${safeFileName}`
        const absolutePath = path.join(uploadDir, safeFileName)

        // 업로드 디렉토리 생성 (존재하지 않는 경우)
        await mkdir(uploadDir, { recursive: true })

        // 파일 쓰기
        await writeFile(absolutePath, buffer)

        // 녹화 정보 DB 저장
        const recording = await prisma.recording.create({
            data: {
                sessionId,
                type: type as any,
                url: relativePath,
                duration: 0,
                fileSize: buffer.length,
                startTime: new Date(),
            },
        })

        if (questionId) {
            // 답변 레코드 생성/업데이트 (영상 URL만 저장)
            await prisma.answer.upsert({
                where: {
                    sessionId_questionId: {
                        sessionId,
                        questionId,
                    }
                },
                update: {
                    audioUrl: relativePath,
                },
                create: {
                    sessionId,
                    questionId,
                    audioUrl: relativePath,
                    content: "",
                    selectedOptions: [],
                    timeSpent: 0,
                }
            })
        }

        return NextResponse.json({
            success: true,
            recording,
        })
    } catch (error) {
        console.error('Recording upload error:', error)
        return NextResponse.json({ success: false, error: '녹화 파일 업로드 중 오류가 발생했습니다.' }, { status: 500 })
    }
}
