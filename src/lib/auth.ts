import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'
import { env } from './env'

export interface JWTPayload {
  userId: string
  email?: string
  name: string
  role: UserRole
}

export interface SessionUser {
  id: string
  email?: string | null
  name: string
  role: UserRole
}

// 비밀번호 해싱
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// 비밀번호 검증
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// JWT 토큰 생성
export function createToken(payload: JWTPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' })
}

// JWT 토큰 검증
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

// 현재 세션 사용자 가져오기
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) return null

    const payload = verifyToken(token)
    if (!payload) return null

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    return user
  } catch {
    return null
  }
}

// 관리자 권한 체크
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required')
  }
  return user
}

// 면접관/관리자 권한 체크
export async function requireExaminer(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user || (user.role !== 'ADMIN' && user.role !== 'EXAMINER')) {
    throw new Error('Unauthorized: Examiner access required')
  }
  return user
}

// 초대 코드 생성
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// 초대 코드 검증 및 사용
export async function validateAndUseInviteCode(
  code: string,
  candidateName: string
): Promise<{ examId: string; userId: string } | null> {
  const inviteCode = await prisma.inviteCode.findUnique({
    where: { code },
    include: { exam: true },
  })

  if (!inviteCode) return null
  if (!inviteCode.isActive) return null
  if (inviteCode.usedCount >= inviteCode.maxUses) return null
  if (new Date() > inviteCode.expiresAt) return null

  // 사용자 생성
  const user = await prisma.user.create({
    data: {
      name: candidateName,
      role: 'CANDIDATE',
    },
  })

  // 사용 횟수 증가 및 사용 기록
  await prisma.$transaction([
    prisma.inviteCode.update({
      where: { id: inviteCode.id },
      data: { usedCount: { increment: 1 } },
    }),
    prisma.inviteCodeUsage.create({
      data: {
        inviteCodeId: inviteCode.id,
        candidateName,
      },
    }),
  ])

  return { examId: inviteCode.examId, userId: user.id }
}
