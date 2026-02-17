import { create } from 'zustand'
import { Exam, Question, Answer, ExamSession, CheatingLogItem } from '@/types'

interface ExamState {
  // 시험/면접 정보
  exam: Exam | null
  questions: Question[]
  currentQuestionIndex: number
  answers: Record<string, Answer>
  session: ExamSession | null

  // 타이머
  remainingTime: number
  isTimerRunning: boolean

  // 부정행위 관련
  cheatingLogs: CheatingLogItem[]
  cheatingScore: number

  // 미디어 상태
  isCameraOn: boolean
  isMicOn: boolean
  isRecording: boolean

  // Actions
  setExam: (exam: Exam) => void
  setQuestions: (questions: Question[]) => void
  setSession: (session: ExamSession) => void
  goToQuestion: (index: number) => void
  nextQuestion: () => void
  prevQuestion: () => void
  setAnswer: (questionId: string, answer: Partial<Answer>) => void
  setRemainingTime: (time: number) => void
  startTimer: () => void
  stopTimer: () => void
  addCheatingLog: (log: CheatingLogItem) => void
  setCheatingScore: (score: number) => void
  toggleCamera: () => void
  toggleMic: () => void
  setRecording: (recording: boolean) => void
  syncGlobalState: (currentQuestionIndex: number, currentStartTime: Date | null) => void
  reset: () => void
  submitExam: () => Promise<boolean>
}

const initialState = {
  exam: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  session: null,
  remainingTime: 0,
  isTimerRunning: false,
  cheatingLogs: [],
  cheatingScore: 0,
  isCameraOn: true,
  isMicOn: true,
  isRecording: false,
}

export const useExamStore = create<ExamState>()((set, get) => ({
  ...initialState,

  setExam: (exam) => {
    set({ exam, remainingTime: exam.duration * 60 })
  },

  setQuestions: (questions) => set({ questions }),

  setSession: (session) => set({ session }),

  goToQuestion: (index) => {
    const { questions } = get()
    if (index >= 0 && index < questions.length) {
      set({ currentQuestionIndex: index })
    }
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions } = get()
    if (currentQuestionIndex < questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 })
    }
  },

  prevQuestion: () => {
    const { currentQuestionIndex } = get()
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 })
    }
  },

  setAnswer: (questionId, answer) => {
    const { answers } = get()
    set({
      answers: {
        ...answers,
        [questionId]: {
          ...answers[questionId],
          ...answer,
          questionId,
        } as Answer,
      },
    })
  },

  setRemainingTime: (time) => set({ remainingTime: time }),

  startTimer: () => set({ isTimerRunning: true }),

  stopTimer: () => set({ isTimerRunning: false }),

  addCheatingLog: (log) => {
    const { cheatingLogs, cheatingScore } = get()
    set({
      cheatingLogs: [...cheatingLogs, log],
      cheatingScore: Math.min(100, cheatingScore + log.confidence * 10),
    })
  },

  setCheatingScore: (score) => set({ cheatingScore: score }),

  toggleCamera: () => set((state) => ({ isCameraOn: !state.isCameraOn })),

  toggleMic: () => set((state) => ({ isMicOn: !state.isMicOn })),

  setRecording: (recording) => set({ isRecording: recording }),

  syncGlobalState: (serverIndex: number, serverStartTime: Date | null) => {
    const { currentQuestionIndex, questions, exam } = get()

    // 문항 인덱스 동기화
    if (serverIndex !== currentQuestionIndex && serverIndex >= 0 && serverIndex < questions.length) {
      set({ currentQuestionIndex: serverIndex })
    }

    // 타이머 동기화 (서버 시작 시간 기준)
    if (serverStartTime && exam) {
      const startTime = new Date(serverStartTime).getTime()
      const now = new Date().getTime()
      const elapsed = Math.floor((now - startTime) / 1000)

      const limit = questions[serverIndex]?.timeLimit || (exam.duration * 60)
      const remaining = Math.max(0, limit - elapsed)

      const { remainingTime } = get()
      if (Math.abs(remaining - remainingTime) > 2) {
        set({ remainingTime: remaining, isTimerRunning: true })
      }
    }
  },

  reset: () => set(initialState),

  submitExam: async () => {
    const { session, answers, cheatingLogs, cheatingScore } = get()
    if (!session) return false

    try {
      const res = await fetch(`/api/exams/${session.examId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          answers: Object.values(answers),
          cheatingLogs,
          cheatingScore,
        }),
      })

      const data = await res.json()
      return data.success
    } catch (error) {
      console.error('Submit error:', error)
      return false
    }
  },
}))
