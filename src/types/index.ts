import { UserRole, ExamType, ExamStatus, QuestionType, SessionStatus, CheatingType, RecordingType } from '@prisma/client'
import { Server as NetServer, Socket } from 'net'
import { NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'

export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer
    }
  }
}

// 재export
export { UserRole, ExamType, ExamStatus, QuestionType, SessionStatus, CheatingType, RecordingType }

// API 응답 타입
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 사용자 타입
export interface User {
  id: string
  email?: string | null
  name: string
  role: UserRole
  profileImage?: string | null
  createdAt: Date
}

// 시험 타입
export interface Exam {
  id: string
  title: string
  description?: string | null
  type: ExamType
  status: ExamStatus
  duration: number
  startTime?: Date | null
  endTime?: Date | null
  entryStartTime?: Date | null
  entryEndTime?: Date | null
  aiInterviewerName?: string | null // 면접관 이름
  aiInterviewerPrompt?: string | null // 면접관 안내 문구/시스템 설정
  maxQuestions?: number | null
  enableCamera: boolean
  enableMicrophone: boolean
  enableScreenShare: boolean
  enableCheatingDetection: boolean
  randomizeQuestions: boolean
  randomizeOptions: boolean
  preventCopyPaste: boolean
  showResultImmediately: boolean
  passingScore?: number | null
  isGlobalSync: boolean
  currentQuestionIndex: number
  currentQuestionStartTime?: Date | null
  createdAt: Date
  updatedAt: Date
  createdById: string
}

// 문항 옵션 타입
export interface QuestionOption {
  id: string
  content: string
  isCorrect: boolean
}

// 문항 타입
export interface Question {
  id: string
  type: QuestionType
  content: string
  explanation?: string | null
  points: number
  timeLimit?: number | null
  options?: QuestionOption[] | null
  correctAnswer?: string | null
  answerKeywords: string[]
  useAiGrading: boolean
  gradingPrompt?: string | null
  difficulty: number
  tags: string[]
}

// 응시 세션 타입
export interface ExamSession {
  id: string
  examId: string
  userId: string
  status: SessionStatus
  startedAt?: Date | null
  submittedAt?: Date | null
  timeSpent: number
  totalScore?: number | null
  maxScore?: number | null
  percentage?: number | null
  isPassed?: boolean | null
  cheatingScore: number
  cheatingFlags: string[]
  user?: User
}

// 부정행위 로그 타입
export interface CheatingLogItem {
  id: string
  type: CheatingType
  confidence: number
  description?: string | null
  imageUrl?: string | null
  timestamp: Date
}

// MediaPipe 얼굴 감지 결과
export interface FaceDetectionResult {
  faceCount: number
  isFaceVisible: boolean
  gazeDirection: 'center' | 'left' | 'right' | 'up' | 'down'
  confidence: number
}

// 화상통화 참여자 타입
export interface VideoParticipant {
  id: string
  name: string
  isSpeaking: boolean
  isMuted: boolean
  isVideoEnabled: boolean
}

// 답변 타입
export interface Answer {
  id: string
  sessionId: string
  questionId: string
  content?: string | null
  selectedOptions: string[]
  audioUrl?: string | null
  score?: number | null
  maxScore?: number | null
  feedback?: string | null
  isCorrect?: boolean | null
  timeSpent: number
}

// 시험 결과 통계 타입
export interface ExamStatistics {
  totalCandidates: number
  submittedCount: number
  averageScore: number
  highestScore: number
  lowestScore: number
  passRate: number
  questionStats: {
    questionId: string
    correctRate: number
    averageScore: number
  }[]
}

// 초대 코드 타입
export interface InviteCode {
  id: string
  code: string
  examId: string
  maxUses: number
  usedCount: number
  expiresAt: Date
  isActive: boolean
  createdAt: Date
}

// 녹화 타입
export interface Recording {
  id: string
  sessionId: string
  type: RecordingType
  url: string
  duration: number
  fileSize: number
  startTime: Date
  endTime?: Date | null
}
