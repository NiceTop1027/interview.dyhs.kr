'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheatingMonitor } from '@/components/cheating-detection/CheatingMonitor'
import { useExamStore } from '@/stores/exam-store'
import {
  Camera,
  Mic,
  Monitor,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  Play,
  Loader2,
  ShieldCheck,
  Smartphone,
  Video,
} from 'lucide-react'

interface DeviceStatus {
  camera: boolean
  microphone: boolean
  screen: boolean
}

interface Props { }

export default function ExamWaitingPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params?.examId as string
  const { exam, setExam, setSession, setQuestions } = useExamStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    camera: false,
    microphone: false,
    screen: false,
  })
  const [deviceChecking, setDeviceChecking] = useState(false)
  const [allDevicesReady, setAllDevicesReady] = useState(false)
  const [agreed, setAgreed] = useState(false)

  // 시험 정보 불러오기
  useEffect(() => {
    const fetchExamInfo = async () => {
      try {
        if (!examId) return
        const res = await fetch(`/api/exams/${examId}`)
        const data = await res.json()

        if (data.success) {
          setExam(data.exam)
          if (data.questions) {
            setQuestions(data.questions)
          }
          if (data.session) {
            setSession(data.session)
          }
        } else {
          setError(data.error || '시험 정보를 불러올 수 없습니다.')
        }
      } catch {
        setError('시험 정보를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchExamInfo()
  }, [examId, setExam, setSession, setQuestions])

  // 장치 확인
  const checkDevices = async () => {
    setDeviceChecking(true)
    const status: DeviceStatus = { camera: false, microphone: false, screen: false }

    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
      status.camera = true
      videoStream.getTracks().forEach((track) => track.stop())
    } catch {
      status.camera = false
    }

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      status.microphone = true
      audioStream.getTracks().forEach((track) => track.stop())
    } catch {
      status.microphone = false
    }

    status.screen = true

    setDeviceStatus(status)
    setAllDevicesReady(status.camera && status.microphone)
    setDeviceChecking(false)
  }

  // 자동 시작 트리거
  useEffect(() => {
    if (allDevicesReady && agreed && !loading) {
      const timer = setTimeout(() => {
        startExam()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [allDevicesReady, agreed, loading])

  // 시험 시작
  const startExam = async () => {
    if (!allDevicesReady || !agreed) return

    try {
      if (!examId) return
      const res = await fetch(`/api/exams/${examId}/start`, {
        method: 'POST',
      })
      const data = await res.json()

      if (data.success) {
        router.push(`/exam/${examId}/session`)
      } else {
        setError(data.error || '시험을 시작할 수 없습니다.')
      }
    } catch {
      setError('시험 시작 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="bg-primary/10 p-4 rounded-full border border-primary/20 animate-pulse inline-block">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs">Initializing Session...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="w-5 h-5" />
          <AlertDescription className="font-bold">{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 py-12">
      <div className="container mx-auto px-6 max-w-5xl space-y-12">
        {/* 헤더 */}
        <div className="text-center space-y-6 animate-in">
          <Badge className="bg-primary/10 text-primary border-primary/20 font-black tracking-[0.2em] px-4 py-1.5 uppercase rounded-lg">
            Assessment Portal
          </Badge>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">{exam?.title || '시험/면접'}</h1>
            <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto italic">{exam?.description}</p>
          </div>
          <div className="flex justify-center gap-3">
            <Badge variant="outline" className="h-10 px-4 rounded-xl border-border bg-card shadow-sm gap-2 font-bold transition-all">
              <Clock className="w-4 h-4 text-primary" />
              {exam?.duration}분
            </Badge>
            <Badge variant="outline" className="h-10 px-4 rounded-xl border-border bg-card shadow-sm gap-2 font-bold transition-all">
              <FileText className="w-4 h-4 text-primary" />
              {exam?.type === 'INTERVIEW' ? '비디오 면접' : exam?.type === 'EXAM' ? '온라인 평가' : '하이브리드'}
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            {/* 장치 확인 */}
            <Card className="glass overflow-hidden transition-all hover:shadow-primary/10 hover:translate-y-[-1px]">
              <CardHeader className="bg-muted/30 border-b border-border px-8">
                <CardTitle className="text-xl font-black">장치 무결성 확인</CardTitle>
                <CardDescription className="font-bold text-xs">응시에 필요한 시스템 하드웨어를 검증합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                <div className="space-y-3">
                  <div className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 ${deviceStatus.camera
                    ? 'bg-success/5 border-success/30 shadow-sm shadow-success/10'
                    : 'bg-muted/30 border-border'
                    }`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl transition-all ${deviceStatus.camera
                        ? 'bg-success/10 text-success'
                        : 'bg-muted text-muted-foreground opacity-50'
                        }`}>
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="font-bold">비디오 카메라</span>
                    </div>
                    {deviceStatus.camera ? (
                      <CheckCircle className="w-6 h-6 text-success animate-scale-in" />
                    ) : (
                      <XCircle className="w-6 h-6 text-muted-foreground opacity-30" />
                    )}
                  </div>

                  <div className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 ${deviceStatus.microphone
                    ? 'bg-success/5 border-success/30 shadow-sm shadow-success/10'
                    : 'bg-muted/30 border-border'
                    }`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl transition-all ${deviceStatus.microphone
                        ? 'bg-success/10 text-success'
                        : 'bg-muted text-muted-foreground opacity-50'
                        }`}>
                        <Mic className="w-6 h-6" />
                      </div>
                      <span className="font-bold">오디오 마이크</span>
                    </div>
                    {deviceStatus.microphone ? (
                      <CheckCircle className="w-6 h-6 text-success animate-scale-in" />
                    ) : (
                      <XCircle className="w-6 h-6 text-muted-foreground opacity-30" />
                    )}
                  </div>

                  <div className="flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-300 bg-indigo-500/5 border-indigo-500/30 shadow-sm shadow-indigo-500/10">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
                        <Monitor className="w-6 h-6" />
                      </div>
                      <span className="font-bold">네트워크 안정성</span>
                    </div>
                    {deviceStatus.screen ? (
                      <CheckCircle className="w-6 h-6 text-indigo-500 animate-scale-in" />
                    ) : (
                      <XCircle className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <Button
                  onClick={checkDevices}
                  disabled={deviceChecking}
                  className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-black text-lg transition-all hover:translate-y-[-1px] active:translate-y-px shadow-lg shadow-primary/20"
                >
                  {deviceChecking ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    '장치 상태 스캔'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* 주의사항 */}
            <Card className="glass">
              <CardHeader className="bg-destructive/5 border-b border-border/50 px-8">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-destructive/80">응시 주의사항 및 보안 서약</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <ul className="space-y-4">
                  {[
                    '응시 중 탭 또는 창 전환 시 부정행위로 간주되어 자동 로그가 생성됩니다.',
                    '프록터링 기능이 카메라를 통해 시선 및 자리 비움을 실시간 감지합니다.',
                    '클립보드(복사/붙여넣기) 및 화면 캡처는 기술적으로 차단됩니다.',
                    '모든 응시 과정은 보안을 위해 비디오 및 오디오로 상시 녹화됩니다.'
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="p-1.5 rounded-full bg-destructive/10 text-destructive mt-0.5 shrink-0">
                        <ShieldCheck className="w-3 h-3" />
                      </div>
                      <p className="text-xs font-bold leading-relaxed text-foreground/80">{text}</p>
                    </li>
                  ))}
                </ul>

                <div className="pt-6 border-t border-border">
                  <label className="flex items-center gap-4 cursor-pointer p-4 bg-muted/30 rounded-2xl border border-border/50 group hover:bg-muted/50 transition-all">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="w-5 h-5 rounded-lg border-border text-primary focus:ring-primary shadow-sm"
                    />
                    <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors">본인은 위의 모든 보안 지침을 숙지하였으며 준수할 것을 서약합니다.</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 sticky top-24">
            {/* 카메라 미리보기 */}
            <Card className="bg-black rounded-2xl overflow-hidden group shadow-[0_18px_60px_-44px_rgba(0,0,0,0.85)] border border-white/10">
              <CardHeader className="bg-white/5 backdrop-blur-md border-b border-white/10 px-8 py-4 relative z-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Live Preview
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0 aspect-video relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheatingMonitor enabled={deviceStatus.camera} showVideo={true} />
                </div>
                {!deviceStatus.camera && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/80 backdrop-blur-sm space-y-4">
                    <Video className="w-12 h-12 text-white/20 animate-pulse" />
                    <p className="text-[10px] font-black text-white/40 tracking-[0.2em] uppercase">NO SIGNAL DETECTED</p>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black text-white/80 tabular-nums">AUTO FOCUS: ACTIVE</span>
                </div>
              </CardContent>
            </Card>

            {/* 시작 컨트롤 */}
            <div className="space-y-4">
              <Button
                size="xl"
                onClick={startExam}
                disabled={!allDevicesReady || !agreed}
                className="w-full h-16 rounded-2xl bg-primary text-primary-foreground font-black text-xl shadow-primary-lg hover:shadow-2xl transition-all hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100 flex items-center justify-center gap-3 group"
              >
                {allDevicesReady && agreed ? (
                  <>
                    <Play className="w-6 h-6" />
                    <span>시험 시작</span>
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6 fill-current group-hover:translate-x-1 transition-transform" />
                    {exam?.type === 'INTERVIEW' ? '평가 세션 진입' : '테스트 시작하기'}
                  </>
                )}
              </Button>

              <div className="flex flex-col items-center gap-2">
                {!allDevicesReady && (
                  <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest animate-in fade-in">
                    주의: 모든 장치 체크 가이드를 완료해주십시오.
                  </p>
                )}
                {allDevicesReady && !agreed && (
                  <p className="text-[11px] text-primary font-black uppercase tracking-widest animate-pulse">
                    장치 연결 확인됨. 하단 보안 서약에 체크하십시오.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 푸터 워터마크 */}
      <div className="container mx-auto px-6 max-w-5xl mt-20 pt-8 border-t border-border/30 text-center">
        <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.5em] italic">DY-INTERVIEW ENTERPRISE SECURITY PORTAL // v2.4.0</p>
      </div>
    </div>
  )
}
