'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheatingMonitor } from '@/components/cheating-detection/CheatingMonitor'
import { useExamStore } from '@/stores/exam-store'
import {
  Clock,
  Send,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Mic,
  MicOff,
  Video,
  VideoOff,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { LiveKitRoom, useLocalParticipant } from '@livekit/components-react'
import '@livekit/components-styles'
import type { QuestionOption } from '@/types'

interface Props { }

export default function ExamSessionPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params?.examId as string
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // 시간 포맷
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 녹화 단계 관리
  const [interviewPhase, setInterviewPhase] = useState<'IDLE' | 'PREPARING' | 'RECORDING' | 'STOPPED'>('IDLE')
  const [phaseCountdown, setPhaseCountdown] = useState(0)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const {
    exam,
    questions,
    currentQuestionIndex,
    answers,
    session,
    remainingTime,
    isTimerRunning,
    isCameraOn,
    isMicOn,
    cheatingScore,
    nextQuestion,
    prevQuestion,
    setAnswer,
    setRemainingTime,
    startTimer,
    toggleCamera,
    toggleMic,
    submitExam,
    syncGlobalState,
    setExam,
    setQuestions,
    setSession,
  } = useExamStore()

  useEffect(() => {
    // 현재 스토어의 시험 ID가 URL의 파라미터와 다르면 (또는 없으면) 초기화 및 데이터 로드
    if (!exam || exam.id !== examId || questions.length === 0) {
      const fetchData = async () => {
        try {
          if (!examId) return

          // 항상 스토어 초기화
          useExamStore.getState().reset()

          const res = await fetch(`/api/exams/${examId}`)
          const data = await res.json()
          if (data.success) {
            setExam(data.exam)
            if (data.questions) setQuestions(data.questions)
            if (data.session) setSession(data.session)
          }
        } catch (error) {
          console.error('Failed to fetch exam data:', error)
        }
      }
      fetchData()
    }
  }, [examId, setExam, setQuestions, setSession]) // dependencies reduced to avoid unnecessary re-runs

  const isInterview = exam?.type === 'INTERVIEW'
  const currentQuestion = questions[currentQuestionIndex]
  const questionOptions =
    currentQuestion && Array.isArray(currentQuestion.options)
      ? (currentQuestion.options as QuestionOption[])
      : []


  const [isFinalizing, setIsFinalizing] = useState(false)

  // 시험 제출
  const handleSubmitExam = useCallback(async () => {
    // 제출 확인창이 뜰 때 탭 포커스 위반 등이 발생하지 않도록 감지 일시 정지
    setIsFinalizing(true)

    // 약간의 지연을 주어 상태가 반영되게 함
    await new Promise(resolve => setTimeout(resolve, 100))

    const confirmed = window.confirm('시험을 제출하시겠습니까? 제출 후에는 수정할 수 없습니다.')
    if (!confirmed) {
      setIsFinalizing(false)
      return
    }

    const success = await submitExam()
    if (success) {
      router.push(`/exam/${examId}/result`)
    } else {
      setIsFinalizing(false)
      alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }, [examId, router, submitExam])

  // 시간 종료시 자동 제출
  useEffect(() => {
    if (remainingTime <= 0 && isTimerRunning) {
      handleSubmitExam()
    }
  }, [remainingTime, isTimerRunning, handleSubmitExam])

  // 시험 시작시 타이머 시작
  useEffect(() => {
    if (exam && !isTimerRunning) {
      startTimer()
    }
  }, [exam, isTimerRunning, startTimer])

  const uploadRecording = async (blob: Blob) => {
    if (!session || !currentQuestion) return
    setIsUploading(true)

    const formData = new FormData()
    formData.append('file', blob, 'recording.webm')
    formData.append('sessionId', session.id)
    formData.append('questionId', currentQuestion.id)
    formData.append('type', 'CAMERA')

    try {
      console.log(`[Recording] Uploading blob for question ${currentQuestion.id}, size: ${blob.size} bytes`)
      const res = await fetch('/api/interview/recording', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        console.log('[Recording] Uploaded successfully:', data.recording?.url)
      } else {
        console.error('[Recording] Upload failed:', data.error)
      }
    } catch (error) {
      console.error('[Recording] Error during upload:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('[Recording] Stopping recorder...')
      mediaRecorderRef.current.stop()
    }
  }, [])

  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      // 1순위: DOM에서 직접 video 스트림 가져오기 시도 (더 빠름)
      const videoElement = document.querySelector('video.mirror') as HTMLVideoElement
      if (videoElement && videoElement.srcObject) {
        console.log('[Recording] Found stream from DOM fallback')
        streamRef.current = videoElement.srcObject as MediaStream
      }
    }

    if (!streamRef.current) {
      console.warn('[Recording] Stream not ready, starting fast retry loop...')
      let retryCount = 0
      const retryInterval = setInterval(() => {
        // 다시 DOM 체크 및 ref 체크
        const videoElement = document.querySelector('video.mirror') as HTMLVideoElement
        if (videoElement && videoElement.srcObject) {
          streamRef.current = videoElement.srcObject as MediaStream
        }

        if (streamRef.current) {
          clearInterval(retryInterval)
          startRecording()
        } else {
          retryCount++
          if (retryCount >= 25) { // 200ms * 25 = 5s 대기
            clearInterval(retryInterval)
            console.error('[Recording] Stream not available after 5 seconds')
            setInterviewPhase('RECORDING')
            setPhaseCountdown(30)
          }
        }
      }, 200) // 200ms 주기로 더 빠르게 체크
      return
    }

    try {
      chunksRef.current = []
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : ''

      if (!mimeType) {
        setInterviewPhase('RECORDING')
        setPhaseCountdown(30)
        return
      }

      const recorder = new MediaRecorder(streamRef.current, {
        mimeType,
        // 720p 기준 체감 화질 개선
        videoBitsPerSecond: 4500000,
        audioBitsPerSecond: 128000,
      })

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = async () => {
        console.log('[Recording] Recorder stopped, processing chunks...')
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' })
          await uploadRecording(blob)
          setInterviewPhase('STOPPED')
          setPhaseCountdown(0)
        } else {
          console.warn('[Recording] No chunks available to upload')
          setInterviewPhase('STOPPED')
          setPhaseCountdown(0)
        }
      }

      recorder.start(1000)
      mediaRecorderRef.current = recorder

      // 상태 전환을 확실하게 처리
      setInterviewPhase('RECORDING')
      setPhaseCountdown(30)
      console.log('[Recording] Successfully started recording phase')
    } catch (err) {
      console.error('[Recording] Start error:', err)
      setInterviewPhase('RECORDING')
      setPhaseCountdown(30)
    }
  }, [session, currentQuestion])

  // 비디오 면접 단계 타이머
  useEffect(() => {
    if (!isInterview || interviewPhase === 'IDLE' || interviewPhase === 'STOPPED' || isUploading) return

    const timer = setInterval(() => {
      setPhaseCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isInterview, interviewPhase, phaseCountdown, isUploading])

  // 페이즈 전환 트리거
  useEffect(() => {
    if (!isInterview || phaseCountdown > 0 || isUploading) return

    if (interviewPhase === 'PREPARING') {
      startRecording()
    } else if (interviewPhase === 'RECORDING') {
      stopRecording()
    }
  }, [phaseCountdown, interviewPhase, isInterview, startRecording, stopRecording, isUploading])

  // 질문 변경 시 단계 초기화
  useEffect(() => {
    if (isInterview && questions.length > 0) {
      setInterviewPhase('PREPARING')
      setPhaseCountdown(15) // 준비 시간 15초
    }
  }, [currentQuestionIndex, isInterview, questions.length])

  const handleStreamReady = useCallback((stream: MediaStream) => {
    streamRef.current = stream
  }, [])

  // 글로벌 동기화 폴링
  useEffect(() => {
    if (!exam?.isGlobalSync || remainingTime <= 0) return

    const poll = async () => {
      try {
        if (!examId) return
        const res = await fetch(`/api/exams/${examId}`)
        const data = await res.json()
        if (data.success && data.exam) {
          syncGlobalState(data.exam.currentQuestionIndex, data.exam.currentQuestionStartTime)
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }

    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [exam?.isGlobalSync, examId, remainingTime, syncGlobalState])

  const handleOptionSelect = (optionId: string) => {
    if (!currentQuestion) return

    const current = answers[currentQuestion.id]?.selectedOptions || []
    const isMultiple = currentQuestion.type === 'MULTIPLE_SELECT'

    let newSelected: string[]
    if (isMultiple) {
      if (current.includes(optionId)) {
        newSelected = current.filter((id) => id !== optionId)
      } else {
        newSelected = [...current, optionId]
      }
    } else {
      newSelected = [optionId]
    }

    setAnswer(currentQuestion.id, { selectedOptions: newSelected })
  }

  const handleTextAnswer = (content: string) => {
    if (!currentQuestion) return
    setAnswer(currentQuestion.id, { content })
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col relative overflow-hidden">
      {/* LiveKit Connection */}
      {examId && session?.user?.id && (
        <LiveConnection
          roomName={`exam-${examId}`}
          username={session.user.name}
          stream={streamRef.current}
        />
      )}

      {/* 상단 바 */}
      <header className="bg-white dark:bg-gray-800 border-b px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold">{exam?.title}</h1>
          {!isInterview && (
            <span className="text-sm text-muted-foreground">
              문항 {currentQuestionIndex + 1} / {questions.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {cheatingScore > 0 && (
            <Badge variant="destructive">
              <AlertTriangle className="w-3 h-3 mr-1" />
              경고 {Math.round(cheatingScore)}점
            </Badge>
          )}

          <Button variant="ghost" size="icon" onClick={toggleMic}>
            {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-red-500" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleCamera}>
            {isCameraOn ? (
              <Video className="w-4 h-4" />
            ) : (
              <VideoOff className="w-4 h-4 text-red-500" />
            )}
          </Button>

          {currentQuestionIndex === questions.length - 1 && (
            <Button onClick={handleSubmitExam} variant="destructive" disabled={isUploading}>
              {isUploading ? '저장 중...' : '최종 제출'}
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 메인 콘텐츠 */}
        <main className="flex-1 p-6 overflow-auto relative">
          {isInterview ? (
            <Card className="h-full flex flex-col relative overflow-hidden">
              <CardHeader className="border-b flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  비디오 면접 진행 중
                </CardTitle>
                <div className="flex items-center gap-4">
                  {interviewPhase === 'PREPARING' && (
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 animate-pulse">
                      준비 시간: {phaseCountdown}초
                    </Badge>
                  )}
                  {interviewPhase === 'RECORDING' && (
                    <Badge variant="destructive" className="animate-pulse">
                      녹화 중: {phaseCountdown}초
                    </Badge>
                  )}
                  {interviewPhase === 'STOPPED' && (
                    <Badge variant="secondary">녹화 종료</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-6 space-y-6 relative overflow-hidden">
                {/* 상단 통합 카운트다운 및 상태 표시 (질문 가림 방지) */}
                {(interviewPhase === 'PREPARING' || interviewPhase === 'RECORDING') && !isUploading && (
                  <div className="absolute top-4 left-0 right-0 z-50 pointer-events-none flex flex-col items-center">
                    <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl px-5 py-2 rounded-full border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex items-center gap-4 animate-in fade-in zoom-in duration-300">
                      {interviewPhase === 'RECORDING' && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-600/10 rounded-full border border-red-600/20">
                          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                          <span className="text-red-600 font-black text-[10px] tracking-tighter uppercase">REC</span>
                        </div>
                      )}
                      {interviewPhase === 'PREPARING' && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-600/10 rounded-full border border-amber-600/20">
                          <span className="text-amber-600 font-black text-[10px] tracking-tighter uppercase">READY</span>
                        </div>
                      )}
                      <div className={`text-3xl font-black tabular-nums ${interviewPhase === 'RECORDING' ? 'text-red-600' : 'text-amber-500'
                        }`}>
                        {phaseCountdown}
                      </div>
                    </div>
                  </div>
                )}

                {/* 업로드 중 로딩 오버레이 */}
                {isUploading && (
                  <div className="absolute inset-0 z-[60] bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
                    <p className="font-bold text-lg text-blue-600">답변 영상을 안전하게 저장 중입니다...</p>
                    <p className="text-sm text-muted-foreground mt-1">잠시만 기다려 주세요.</p>
                  </div>
                )}

                {/* 현재 질문 표시 (지극히 강조됨) */}
                <div className="flex-1 flex flex-col items-center justify-center py-20">
                  <div className="w-full max-w-4xl mx-auto space-y-12">
                    <div className="text-center space-y-3 animate-in fade-in slide-in-from-top-4 duration-700">
                      <Badge variant="outline" className="text-blue-600 border-blue-200/50 bg-blue-50/30 px-4 py-1 uppercase tracking-[0.3em] font-black text-[10px] rounded-full">Question {currentQuestionIndex + 1}</Badge>
                      <h2 className="text-lg font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">질문 내용을 확인하고 답변해 주세요</h2>
                    </div>

                    <div className="relative group">
                      <div className="absolute -inset-2 bg-gradient-to-r from-foreground/10 to-foreground/5 rounded-[3rem] blur-xl opacity-50 group-hover:opacity-70 transition"></div>
                      <div className="relative bg-card p-16 md:p-24 rounded-[3rem] border-2 border-border/50 shadow-2xl text-center">
                        <div
                          className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight"
                          dangerouslySetInnerHTML={{ __html: currentQuestion?.content || '' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 하단 플로팅 액션 바 (녹화 중일 때 하단 중앙에 배치) */}
                {interviewPhase === 'RECORDING' && !isUploading && (
                  <div className="absolute bottom-12 left-0 right-0 z-50 flex justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={stopRecording}
                      className="h-20 px-12 rounded-full font-black text-xl shadow-[0_20px_50px_rgba(220,38,38,0.3)] hover:scale-110 active:scale-95 transition-all group bg-red-600 hover:bg-red-700 border-none"
                    >
                      <div className="w-4 h-4 bg-white rounded-sm mr-4 group-hover:rotate-90 transition-transform duration-500" />
                      답변 완료
                    </Button>
                  </div>
                )}

                {/* 답변 대기/완료 상태 안내 */}
                {(interviewPhase === 'PREPARING' || interviewPhase === 'STOPPED') && !isUploading && (
                  <div className="flex flex-col items-center justify-center space-y-4 pb-8">
                    {interviewPhase === 'PREPARING' && (
                      <p className="text-amber-600 font-bold animate-pulse text-sm">잠시 후 자동으로 녹화가 시작됩니다...</p>
                    )}
                    {interviewPhase === 'STOPPED' && (
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 text-green-600 font-bold">
                          <CheckCircle className="w-5 h-5" />
                          답변 기록이 완료되었습니다
                        </div>
                        <Button size="lg" onClick={nextQuestion} disabled={currentQuestionIndex === questions.length - 1} className="rounded-full px-10 font-black shadow-xl">
                          다음 문항으로 이동
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* 하단 진행도 */}
                <div className="pt-6 border-t">
                  <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2">
                    <span>전체 진행도</span>
                    <span>{currentQuestionIndex + 1} / {questions.length}</span>
                  </div>
                  <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    문항 {currentQuestionIndex + 1}
                  </CardTitle>
                  <Badge variant="outline">{currentQuestion?.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: currentQuestion?.content || '' }}
                />

                {(currentQuestion?.type === 'MULTIPLE_CHOICE' ||
                  currentQuestion?.type === 'MULTIPLE_SELECT') && (
                    <div className="space-y-2">
                      {questionOptions.map((option) => {
                        const isSelected = answers[currentQuestion.id]?.selectedOptions?.includes(
                          option.id
                        )
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleOptionSelect(option.id)}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-gray-300'
                                  }`}
                              >
                                {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                              </div>
                              <span>{option.content}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                {(currentQuestion?.type === 'SHORT_ANSWER' ||
                  currentQuestion?.type === 'ESSAY') && (
                    <Textarea
                      value={answers[currentQuestion?.id]?.content || ''}
                      onChange={(e) => handleTextAnswer(e.target.value)}
                      placeholder="답변을 입력하세요..."
                      className="min-h-[200px]"
                    />
                  )}

                {currentQuestion?.type === 'SPEAKING' && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-primary/5 rounded-3xl border-2 border-dashed border-primary/20">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                      <Mic className="w-10 h-10 text-primary" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-1">비디오 답변 수집 중</h3>
                      <p className="text-sm text-muted-foreground">카메라와 마이크를 통해 답변 영상을 기록합니다.</p>
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <Badge variant="outline" className="animate-bounce">ON AIR</Badge>
                      <span className="text-xs font-medium">카메라를 보고 답변에 집중하세요.</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={prevQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    이전 문항
                  </Button>

                  <div className="flex gap-1">
                    {questions.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => useExamStore.getState().goToQuestion(index)}
                        className={`w-8 h-8 rounded text-sm ${index === currentQuestionIndex
                          ? 'bg-blue-600 text-white'
                          : answers[questions[index]?.id]
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30'
                            : 'bg-gray-100 dark:bg-gray-800'
                          }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={nextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1 || exam?.isGlobalSync}
                  >
                    {exam?.isGlobalSync ? '호스트 대기 중' : '다음 문항'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>

        <aside className="w-96 bg-surface-raised border-l-2 border-border/50 p-6 flex flex-col gap-6">
          <div>
            <h3 className="font-black mb-3 text-xs uppercase tracking-widest text-muted-foreground/60">Proctor Camera</h3>
            <div className="rounded-2xl overflow-hidden border-2 border-border/50 shadow-lg">
              <CheatingMonitor
                enabled={!isUploading && !isFinalizing}
                showVideo={true}
                onStreamReady={handleStreamReady}
              />
            </div>
          </div>

          {!isInterview && (
            <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
              <h3 className="font-black mb-3 text-xs uppercase tracking-widest text-muted-foreground/60">Progress</h3>
              <Progress
                value={(Object.keys(answers).length / questions.length) * 100}
                className="h-2"
              />
              <p className="text-xs font-bold text-muted-foreground mt-2 text-right">
                {Object.keys(answers).length} / {questions.length} 문항 완료
              </p>
            </div>
          )}

          <Alert className="bg-warning/10 border-warning/30 border-2 shadow-sm">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <AlertDescription className="text-xs font-bold text-foreground/80 leading-relaxed">
              화면을 이탈하거나 카메라에서 얼굴이 사라지면 기록에 남습니다.
            </AlertDescription>
          </Alert>
        </aside>
      </div>
    </div>
  )
}

function LiveConnection({ roomName, username, stream }: { roomName: string, username: string, stream: MediaStream | null }) {
  const [token, setToken] = useState('')
  const [error, setError] = useState(false)
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL

  // LiveKit이 설정되지 않은 경우 렌더링하지 않음
  if (!livekitUrl) {
    return null
  }

  useEffect(() => {
    let mounted = true

    const fetchToken = async () => {
      try {
        const resp = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName }),
        })

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`)
        }

        const data = await resp.json()

        if (!mounted) return

        if (data.success && data.token) {
          setToken(data.token)
          setError(false)
        } else {
          console.warn('LiveKit 토큰 생성 실패:', data.error)
          setError(true)
        }
      } catch (e) {
        console.warn('LiveKit 연결을 건너뜁니다:', e)
        if (mounted) {
          setError(true)
        }
      }
    }

    fetchToken()

    return () => {
      mounted = false
    }
  }, [roomName])

  // 에러가 발생하거나 토큰이 없으면 아무것도 렌더링하지 않음
  if (error || !token) return null

  return (
    <LiveKitRoom
      token={token}
      serverUrl={livekitUrl}
      connect={true}
      onError={(error) => {
        console.warn('LiveKit 연결 오류 (무시됨):', error)
      }}
      onDisconnected={() => {
        console.log('LiveKit 연결 해제됨')
      }}
    >
      <LivePublisher stream={stream} />
    </LiveKitRoom>
  )
}

function LivePublisher({ stream }: { stream: MediaStream | null }) {
  const { localParticipant } = useLocalParticipant()

  useEffect(() => {
    if (stream && localParticipant) {
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        localParticipant.publishTrack(videoTrack).catch(err => console.error('Failed to publish video:', err))
      }
    }
  }, [stream, localParticipant])

  return null
}
