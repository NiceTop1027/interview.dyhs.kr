'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  XCircle,
  Trophy,
  Clock,
  FileText,
  Home,
  AlertTriangle,
  Video,
  MessageSquare,
  Play,
} from 'lucide-react'

interface Props { }

interface ExamResult {
  session: {
    id: string
    totalScore: number
    maxScore: number
    percentage: number
    isPassed: boolean | null
    timeSpent: number
    cheatingScore: number
    cheatingFlags: string[]
    submittedAt: string
    recordingUrl?: string
  }
  exam: {
    title: string
    type: string
    passingScore: number | null
    showResultImmediately: boolean
  }
  answers?: {
    questionId: string
    isCorrect: boolean
    score: number
    maxScore: number
    feedback?: string
  }[]
}

export default function ExamResultPage() {
  const params = useParams()
  const examId = params?.examId as string
  const [result, setResult] = useState<ExamResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchResult = async () => {
      try {
        if (!examId) return
        const res = await fetch(`/api/exams/${examId}/result`)
        const data = await res.json()

        if (data.success) {
          setResult(data)
        } else {
          setError(data.error || '결과를 불러올 수 없습니다.')
        }
      } catch {
        setError('결과를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchResult()
  }, [examId])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}분 ${secs}초`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">결과를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{error || '결과를 확인할 수 없습니다.'}</p>
            <Button asChild>
              <Link href="/">홈으로 돌아가기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { session, exam } = result
  const isPassed = session.isPassed
  const showDetails = exam.showResultImmediately

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* 결과 헤더 */}
        <Card className="mb-6 overflow-hidden glass">
          <div
            className={`p-6 text-center text-white ${isPassed === true
              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
              : isPassed === false
                ? 'bg-gradient-to-r from-red-500 to-rose-600'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600'
              }`}
          >
            <div className="mb-4">
              {isPassed === true ? (
                <Trophy className="w-16 h-16 mx-auto" />
              ) : isPassed === false ? (
                <XCircle className="w-16 h-16 mx-auto" />
              ) : (
                <CheckCircle className="w-16 h-16 mx-auto" />
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {exam.type === 'INTERVIEW'
                ? '면접이 완료되었습니다.'
                : isPassed === true
                  ? '축하합니다! 합격입니다!'
                  : isPassed === false
                    ? '아쉽습니다. 불합격입니다.'
                    : '시험이 완료되었습니다!'}
            </h1>
            <p className="opacity-90">{exam.title}</p>
          </div>

          <CardContent className="p-6">
            {/* 점수 (면접의 경우 숨김) */}
            {exam.type !== 'INTERVIEW' && (
              <>
                <div className="text-center mb-6">
                  <div className="text-6xl md:text-7xl font-black mb-6 tracking-tight">
                    {session.percentage.toFixed(1)}
                    <span className="text-3xl text-muted-foreground font-bold">점</span>
                  </div>
                  <p className="text-lg font-bold text-muted-foreground mb-2">
                    {session.totalScore} / {session.maxScore}점
                  </p>
                  {exam.passingScore && (
                    <Badge variant="outline" size="lg" className="mt-2">
                      합격 기준: {exam.passingScore}점
                    </Badge>
                  )}
                </div>
                <Progress value={session.percentage} className="h-3 mb-6" />
              </>
            )}

            {/* 통계 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-card/60 border border-border/60 rounded-2xl shadow-xs">
                <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <p className="text-sm text-muted-foreground">소요 시간</p>
                <p className="font-semibold">{formatTime(session.timeSpent)}</p>
              </div>
              <div className="text-center p-4 bg-card/60 border border-border/60 rounded-2xl shadow-xs">
                <FileText className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                <p className="text-sm text-muted-foreground">시험 유형</p>
                <p className="font-semibold">
                  {exam.type === 'INTERVIEW'
                    ? '비디오 면접'
                    : exam.type === 'EXAM'
                      ? '온라인 시험'
                      : '혼합'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 부정행위 경고 */}
        {session.cheatingScore > 0 && (
          <Card className="mb-6 border-2 border-warning/30 bg-warning/5 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-warning">
                <div className="p-2 rounded-xl bg-warning/10">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                부정행위 감지 기록
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 rounded-2xl bg-warning/10 border border-warning/20">
                <p className="text-sm font-bold text-foreground/80">
                  부정행위 점수: <span className="text-lg text-warning font-black">{session.cheatingScore.toFixed(1)}</span>점
                </p>
              </div>
              {session.cheatingFlags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {session.cheatingFlags.map((flag, index) => (
                    <Badge key={index} variant="warning" size="lg">
                      {flag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 녹화 다시보기 */}
        {session.recordingUrl && (
          <Card className="mb-6 glass">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Video className="w-5 h-5" />
                면접/시험 녹화 다시보기
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video rounded-xl bg-black overflow-hidden group cursor-pointer border border-border/50">
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                  <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center text-white shadow-xl transform group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 fill-current ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white text-xs opacity-80 flex justify-between">
                  <span>{session.id}.mp4</span>
                  <span>{formatTime(session.timeSpent)}</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                ※ 실제 프로덕션 환경에서는 녹화 서버를 통해 저장된 영상이 재생됩니다.
              </p>
            </CardContent>
          </Card>
        )}

        {/* 문항별 결과 (즉시 공개인 경우) */}
        {showDetails && result.answers && result.answers.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>문항별 결과</CardTitle>
              <CardDescription>각 문항의 채점 결과입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.answers.map((answer, index) => (
                  <div
                    key={answer.questionId}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {answer.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span>문항 {index + 1}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">
                        {answer.score} / {answer.maxScore}점
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 액션 버튼 */}
        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="w-5 h-5 mr-2" />
              홈으로 돌아가기
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

