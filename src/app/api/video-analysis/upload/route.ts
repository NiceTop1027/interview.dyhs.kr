export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

import { prisma } from '@/lib/prisma'

import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('video') as File
    const sessionId = formData.get('sessionId') as string
    const userId = formData.get('userId') as string

    if (!file || !sessionId || !userId) {
      return NextResponse.json(
        { error: '비디오 파일, 세션 ID, 사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 파일 형식 검증
    const allowedTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/mov']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '지원되지 않는 비디오 형식입니다.' },
        { status: 400 }
      )
    }

    // 파일 크기 검증 (500MB 제한)
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '파일 크기가 500MB를 초과할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 업로드 디렉토리 생성 (Private)
    const uploadDir = join(process.cwd(), 'uploads', 'videos')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      // 디렉토리가 이미 존재하는 경우 무시
    }

    // 고유 파일명 생성 (Secure, Random)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExtension}`
    const filePath = join(uploadDir, fileName)

    // 파일 저장
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // 데이터베이스에 녹화 정보 저장 (Secure Stream URL)
    const secureUrl = `/api/stream/video/${fileName}`

    const recording = await prisma.recording.create({
      data: {
        sessionId,
        type: 'CAMERA',
        url: secureUrl,
        duration: 0,
        fileSize: file.size,
        startTime: new Date(),
        createdAt: new Date()
      }
    })

    // 세션 정보 업데이트
    await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        recordingUrl: secureUrl,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      recordingId: recording.id,
      fileName,
      filePath: `/uploads/videos/${fileName}`,
      fileSize: file.size,
      message: '비디오 업로드가 성공적으로 완료되었습니다.'
    })

  } catch (error) {
    console.error('Video upload error:', error)
    return NextResponse.json(
      { error: '비디오 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: '세션 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 세션 관련 녹화 파일 조회
    const recordings = await prisma.recording.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      recordings
    })

  } catch (error) {
    console.error('Get recordings error:', error)
    return NextResponse.json(
      { error: '녹화 파일 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
