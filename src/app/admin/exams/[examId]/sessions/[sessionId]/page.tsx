'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    MessageSquare,
    Video,
    AlertTriangle,
    User,
    Clock,
    CheckCircle,
    XCircle,
    Play,
    RotateCcw,
    ShieldAlert,
    BarChart3,
    CheckCircle2,
    Activity,
    ExternalLink,
    Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

interface Props { }

export default function AdminSessionReviewPage() {
    const params = useParams()
    const examId = params?.examId as string
    const sessionId = params?.sessionId as string
    const [session, setSession] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeVideo, setActiveVideo] = useState<string | null>(null)

    const fetchSession = async () => {
        try {
            const res = await fetch(`/api/exams/${examId}/result?sessionId=${sessionId}`)
            const data = await res.json()
            if (data.success) {
                setSession({ ...data.session, answers: data.answers || [] })
                if (data.session.recordings?.length > 0) {
                    setActiveVideo(data.session.recordings[0].url)
                }
            } else {
                setError(data.error || '세션 정보를 불러올 수 없습니다.')
            }
        } catch (err) {
            setError('세션 정보를 불러오는 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSession()
    }, [examId, sessionId])

    const handleStatusUpdate = async (isPassed: boolean | null) => {
        try {
            const res = await fetch(`/api/admin/sessions/${sessionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPassed })
            })
            const data = await res.json()
            if (data.success) {
                setSession({ ...session, isPassed })
                await fetchSession() // Refresh data
            }
        } catch (err) {
            console.error(err)
        }
    }

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Activity className="w-8 h-8 animate-spin text-primary" />
        </div>
    )

    if (error || !session) return (
        <div className="p-10 text-center bg-background min-h-screen flex flex-col items-center justify-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive opacity-50" />
            <p className="text-muted-foreground font-bold">{error || '정보를 찾을 수 없습니다.'}</p>
            <Link href={`/admin/exams/${examId}`}>
                <Button variant="outline">돌아가기</Button>
            </Link>
        </div>
    )

    return (
        <div className="min-h-screen bg-background text-foreground pb-20 selection:bg-primary/20">
            {/* 상단 툴바 */}
            <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-7xl">
                    <div className="flex items-center gap-6">
                        <Link href={`/admin/exams/${examId}`}>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-black tracking-tighter">심층 응시 기록 분석</h1>
                                <Badge variant="outline" className={`rounded-lg px-2 text-[10px] font-black uppercase tracking-widest ${session.isPassed === true ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : session.isPassed === false ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-muted text-muted-foreground'}`}>
                                    {session.isPassed === true ? '최종 합격' : session.isPassed === false ? '최종 불합격' : '심사 대기'}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-bold opacity-70 mt-0.5">Assessment Protocol ID: {session.id}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant={session.isPassed === true ? "default" : "outline"}
                            className={`h-10 px-6 rounded-xl font-black transition-all active:scale-95 ${session.isPassed === true ? "bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20" : "border-emerald-600/20 text-emerald-600 hover:bg-emerald-500/10"}`}
                            onClick={() => handleStatusUpdate(true)}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            합격 승인
                        </Button>
                        <Button
                            variant={session.isPassed === false ? "destructive" : "outline"}
                            className={`h-10 px-6 rounded-xl font-black transition-all active:scale-95 ${session.isPassed === false ? "bg-destructive shadow-xl shadow-destructive/20" : "border-destructive/20 text-destructive hover:bg-destructive/10"}`}
                            onClick={() => handleStatusUpdate(false)}
                        >
                            <XCircle className="w-4 h-4 mr-2" />
                            불합격 처리
                        </Button>
                        {(session.isPassed !== null) && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-xl text-muted-foreground hover:bg-muted"
                                onClick={() => handleStatusUpdate(null)}
                                title="심사 중으로 초기화"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* 왼쪽: 프로필 및 보안 스탯 */}
                    <div className="md:col-span-4 space-y-8">
                        <Card className="border-border shadow-2xl bg-card rounded-[2rem] overflow-hidden ring-1 ring-border/50">
                            <CardContent className="p-8 space-y-8">
                                <div className="flex flex-col items-center text-center space-y-4">
                                    <div className="w-24 h-24 rounded-[2rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-3xl font-black text-primary shadow-inner">
                                        {session.user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight">{session.user.name}</h2>
                                        <p className="text-sm font-bold text-muted-foreground opacity-60 uppercase tracking-widest">{session.user.email}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase opacity-50 mb-1">정답률</p>
                                        <div className="flex items-end gap-1">
                                            <span className="text-2xl font-black tabular-nums">75</span>
                                            <span className="text-xs font-bold text-muted-foreground mb-1">%</span>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase opacity-50 mb-1">소요 시간</p>
                                        <div className="flex items-end gap-1 font-black tabular-nums">
                                            <span className="text-2xl">{Math.floor(session.timeSpent / 60)}</span>
                                            <span className="text-xs text-muted-foreground mb-1">M</span>
                                            <span className="text-2xl ml-1">{session.timeSpent % 60}</span>
                                            <span className="text-xs text-muted-foreground mb-1">S</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={`border-border shadow-2xl bg-card rounded-[2rem] overflow-hidden ring-1 ring-border/50 ${session.cheatingScore > 30 ? 'ring-destructive/50 shadow-destructive/10' : ''}`}>
                            <CardHeader className={`px-8 py-6 border-b border-border ${session.cheatingScore > 30 ? 'bg-destructive/5' : 'bg-muted/10'}`}>
                                <CardTitle className="flex items-center gap-3 text-lg font-black">
                                    <ShieldAlert className={`w-5 h-5 ${session.cheatingScore > 30 ? 'text-destructive' : 'text-amber-500'}`} />
                                    AI 보안 패턴 분석
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-50 mb-1">이상 행동 스코어</p>
                                        <div className="text-4xl font-black tabular-nums tracking-tighter">
                                            {session.cheatingScore?.toFixed(1) || 0}
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-2xl ${session.cheatingScore > 30 ? 'bg-destructive/20 text-destructive' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                        <BarChart3 className="w-8 h-8" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-muted-foreground italic">
                                        {session.cheatingScore > 0 ? '학습된 비전 모델에 의해 감지된 이상 패턴 목록:' : '신뢰할 수 있는 응시 패턴이 분석되었습니다.'}
                                    </p>
                                    {session.cheatingFlags?.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {session.cheatingFlags.map((f: string, i: number) => (
                                                <Badge key={i} variant="secondary" className="bg-muted text-[10px] font-black uppercase px-2 py-1 rounded-lg border border-border">
                                                    {f}
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span className="text-sm font-black uppercase tracking-tighter">Clear Signal</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 오른쪽: 영상 및 답변 디테일 */}
                    <div className="md:col-span-8 space-y-8">
                        {/* 비디오 플레이어 섹션 */}
                        <Card className="border-border shadow-[0_0_50px_rgba(0,0,0,0.3)] bg-black rounded-[2rem] overflow-hidden ring-1 ring-white/10 group">
                            <CardHeader className="bg-zinc-900 border-b border-white/5 flex-row items-center justify-between px-8 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <CardTitle className="text-sm font-black text-white/90 uppercase tracking-[0.2em]">
                                        Recorded Stream Archive
                                    </CardTitle>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-[9px] font-black border-white/20 text-white/40 uppercase tracking-widest px-2 py-0.5">720p Secure Buffer</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 aspect-video bg-zinc-950 flex flex-col relative">
                                {activeVideo ? (
                                    <video
                                        src={activeVideo}
                                        controls
                                        className="w-full h-full object-contain"
                                        autoPlay={false}
                                    />
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                                        <Video className="w-16 h-16 text-white/10 animate-pulse" />
                                        <p className="text-[10px] font-black text-white/40 tracking-[0.3em] uppercase">No Video Feed Found</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* AI 역량 분석 결과 섹션 */}
                        <Card className="border-border shadow-xl bg-card rounded-[2rem] overflow-hidden">
                            <CardHeader className="bg-indigo-500/5 border-b border-border py-4 px-6 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-500" />
                                    <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-500">AI 역량 분석 리포트</CardTitle>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={async () => {
                                        try {
                                            toast.info('AI 분석을 시작합니다... (약 10-20초 소요)')
                                            const res = await fetch('/api/video-analysis/analyze', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ sessionId, videoUrl: activeVideo })
                                            })
                                            const data = await res.json()
                                            if (data.success) {
                                                toast.success('분석이 완료되었습니다.')
                                                fetchSession()
                                            } else {
                                                toast.error('분석 실패: ' + data.error)
                                            }
                                        } catch (e) {
                                            toast.error('분석 요청 중 오류 발생')
                                        }
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-7"
                                >
                                    {session.aiVideoAnalysis ? '재분석 수행' : 'AI 역량 분석 실행'}
                                </Button>
                            </CardHeader>
                            <CardContent className="p-6">
                                {session.aiVideoAnalysis ? (
                                    <div className="space-y-8">
                                        {/* 1. 종합 점수 및 키워드 */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-500/20">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300">종합 역량 점수</p>
                                                        <Sparkles className="w-4 h-4 text-indigo-500" />
                                                    </div>
                                                    <div className="flex items-end gap-2">
                                                        <span className="text-5xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                                                            {(session.aiVideoAnalysis.overall_score * 100).toFixed(0)}
                                                        </span>
                                                        <span className="text-lg font-bold text-indigo-400/70 mb-1">/ 100</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {session.aiVideoAnalysis.speech?.keywords?.map((keyword: string, i: number) => (
                                                        <Badge key={i} variant="secondary" className="bg-muted text-xs font-bold px-2.5 py-1">
                                                            #{keyword}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* 태도/성향 차트 */}
                                            <div className="space-y-3 p-5 rounded-2xl bg-muted/30 border border-border">
                                                <p className="text-xs font-black text-muted-foreground uppercase mb-2">Attitude & Personality</p>

                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="font-bold">자신감 (Confidence)</span>
                                                        <span className="font-mono font-bold">{(session.aiVideoAnalysis.facial?.confidence?.high * 100).toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(session.aiVideoAnalysis.facial?.confidence?.high || 0) * 100}%` }} />
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="font-bold">긍정적 태도 (Positivity)</span>
                                                        <span className="font-mono font-bold">{(session.aiVideoAnalysis.speech?.sentiment?.positive * 100).toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(session.aiVideoAnalysis.speech?.sentiment?.positive || 0) * 100}%` }} />
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="font-bold">전달 명확성 (Clarity)</span>
                                                        <span className="font-mono font-bold">{(session.aiVideoAnalysis.speech?.clarity * 100).toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(session.aiVideoAnalysis.speech?.clarity || 0) * 100}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. 스크립트 (Transcript) */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Speech Transcript Analysis</p>
                                            </div>
                                            <div className="p-5 rounded-2xl bg-muted/20 border border-border text-sm leading-relaxed font-medium text-foreground/90 whitespace-pre-wrap">
                                                {session.aiVideoAnalysis.speech?.transcript || "음성 인식 결과가 없습니다."}
                                            </div>
                                        </div>

                                        {/* 3. 행동/자세 분석 */}
                                        <div>
                                            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Behavioral Metrics</p>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="p-3 bg-muted/20 rounded-xl border border-border text-center">
                                                    <p className="text-[10px] text-muted-foreground mb-1">시선 처리</p>
                                                    <p className="text-lg font-black text-foreground">{(session.aiVideoAnalysis.facial?.gaze?.center * 100).toFixed(0)}<span className="text-xs ml-0.5 text-muted-foreground">%</span></p>
                                                </div>
                                                <div className="p-3 bg-muted/20 rounded-xl border border-border text-center">
                                                    <p className="text-[10px] text-muted-foreground mb-1">집중도</p>
                                                    <p className="text-lg font-black text-foreground">{(session.aiVideoAnalysis.facial?.attention?.focused * 100).toFixed(0)}<span className="text-xs ml-0.5 text-muted-foreground">%</span></p>
                                                </div>
                                                <div className="p-3 bg-muted/20 rounded-xl border border-border text-center">
                                                    <p className="text-[10px] text-muted-foreground mb-1">말하기 속도</p>
                                                    <p className="text-lg font-black text-foreground">{session.aiVideoAnalysis.speech?.speaking_rate}<span className="text-xs ml-0.5 text-muted-foreground">WPM</span></p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 4. AI 코멘트 */}
                                        <div>
                                            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">AI Recommendations</p>
                                            <ul className="space-y-2">
                                                {session.aiVideoAnalysis.recommendations?.map((rec: string, i: number) => (
                                                    <li key={i} className="text-sm bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-2.5">
                                                        <div className="min-w-[4px] h-[4px] mt-2 rounded-full bg-indigo-500" />
                                                        <span className="text-foreground/80 font-medium">{rec}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 space-y-3">
                                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                            <Sparkles className="w-6 h-6 text-muted-foreground/40" />
                                        </div>
                                        <p className="text-sm font-bold text-muted-foreground">
                                            아직 AI 역량 분석 데이터가 없습니다.
                                        </p>
                                        <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto">
                                            상단의 'AI 역량 분석 실행' 버튼을 눌러 상세한 면접 분석 리포트를 생성해보세요.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* 문항별 영상 타임라인 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Card className="border-border shadow-xl bg-card rounded-[2rem] overflow-hidden">
                                <CardHeader className="bg-muted/30 border-b border-border py-4 px-6 flex flex-row items-center justify-between">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest opacity-50">영상 클립 목록</CardTitle>
                                    <Badge className="font-black text-[10px] bg-primary/10 text-primary border-0">{session.recordings?.length || 0}</Badge>
                                </CardHeader>
                                <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                                    <div className="divide-y divide-border/50">
                                        {session.recordings?.map((rec: any, i: number) => {
                                            const isPlaying = activeVideo === rec.url;
                                            return (
                                                <button
                                                    key={rec.id}
                                                    onClick={() => setActiveVideo(rec.url)}
                                                    className={`w-full p-4 flex items-center justify-between transition-all text-left truncate ${isPlaying ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                                                >
                                                    <div className="flex items-center gap-4 truncate">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isPlaying ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                            <Play className={`w-3.5 h-3.5 ${isPlaying ? 'fill-current' : ''}`} />
                                                        </div>
                                                        <div className="truncate">
                                                            <p className={`text-xs font-black truncate ${isPlaying ? 'text-primary' : 'text-foreground'}`}>클립 섹션 {i + 1}</p>
                                                            <p className="text-[9px] font-bold text-muted-foreground italic opacity-50">{new Date(rec.startTime).toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' })} // {(rec.fileSize / (1024 * 1024)).toFixed(2)}MB</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-border shadow-xl bg-card rounded-[2rem] overflow-hidden">
                                <CardHeader className="bg-muted/30 border-b border-border py-4 px-6">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest opacity-50">답변 텍스트 로그</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                                    <div className="p-6 space-y-6">
                                        {session.answers?.map((answer: any, i: number) => (
                                            <div key={answer.questionId} className="space-y-3 pb-6 border-b border-border/50 last:border-0 last:pb-0">
                                                <div className="flex items-center justify-between">
                                                    <Badge variant="outline" className="text-[9px] font-black opacity-50">문항 {i + 1}</Badge>
                                                    {answer.audioUrl ? (
                                                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] font-black text-primary" onClick={() => setActiveVideo(answer.audioUrl)}>
                                                            <Play className="w-2.5 h-2.5 mr-1" />
                                                            PLAY SEGMENT
                                                        </Button>
                                                    ) : (
                                                        <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest">No Link</span>
                                                    )}
                                                </div>
                                                <div className="p-4 rounded-xl bg-muted/20 border border-border">
                                                    <p className="text-[11px] font-bold text-muted-foreground mb-2 leading-relaxed italic opacity-60">Q. {answer.questionContent}</p>
                                                    <p className="text-sm font-bold text-foreground/80 leading-[1.6]">
                                                        {answer.content || <span className="text-xs italic opacity-30">음성/영상 전용 답변 문항입니다.</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
