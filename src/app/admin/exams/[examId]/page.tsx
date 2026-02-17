'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Settings,
  Plus,
  Copy,
  Check,
  Users,
  FileText,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Trash2,
  Timer,
  ChevronRight,
  ExternalLink,
  Video,
  VideoOff,
  List,
  Grid,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ThemeToggle } from '@/components/theme-toggle'
import { LiveKitRoom, VideoTrack, useTracks } from '@livekit/components-react'
import { Track } from 'livekit-client'
import '@livekit/components-styles'

export default function AdminExamPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params?.examId as string

  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState<any>(null)
  const [invites, setInvites] = useState<any[]>([])
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [candidateName, setCandidateName] = useState('')
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [questions, setQuestions] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [advancing, setAdvancing] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterResult, setFilterResult] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list')

  const fetchData = async () => {
    if (!examId) return
    try {
      const examRes = await fetch(`/api/exams/${examId}`)
      const examData = await examRes.json()

      const inviteRes = await fetch(`/api/exams/${examId}/invites`)
      const inviteData = await inviteRes.json()

      const sessionsRes = await fetch(`/api/exams/${examId}/sessions`)
      const sessionsData = await sessionsRes.json()

      if (examData.success) {
        setExam(examData.exam)
        setQuestions(examData.questions || [])
      }
      if (inviteData.success) {
        setInvites(inviteData.invites)
      }
      if (sessionsData.success) {
        setSessions(sessionsData.sessions)
      }
    } catch (error) {
      console.error('Fetch data error:', error)
      toast.error('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!examId) return

    fetchData()
    const interval = setInterval(() => {
      fetchData()
    }, 10000)

    return () => clearInterval(interval)
  }, [examId])

  const handleStatusUpdate = async (status: string) => {
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('상태가 업데이트되었습니다.')
        fetchData()
      }
    } catch (error) {
      toast.error('상태 변경 실패')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success('초대 코드가 복사되었습니다.')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const copyText = (text: string, message: string) => {
    navigator.clipboard.writeText(text)
    toast.success(message)
  }

  const handleCreateInviteSymbol = async () => {
    setCreatingInvite(true)
    try {
      const res = await fetch(`/api/exams/${examId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: candidateName.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        const inviteUrl = data.inviteUrl as string | undefined
        if (inviteUrl) {
          setLastInviteUrl(inviteUrl)
          copyText(inviteUrl, '전용 초대 링크가 생성되어 복사되었습니다.')
        } else {
          toast.success('새 초대 코드가 생성되었습니다.')
        }
        setCandidateName('')
        fetchData()
      }
    } catch (error) {
      toast.error('코드 생성 실패')
    } finally {
      setCreatingInvite(false)
    }
  }

  const deleteInvite = async (inviteId: string) => {
    if (!confirm('정말 이 초대 코드를 삭제하시겠습니까?')) return
    try {
      const res = await fetch(`/api/exams/${examId}/invites/${inviteId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('삭제되었습니다.')
        fetchData()
      }
    } catch (error) {
      toast.error('삭제 실패')
    }
  }

  const handleAdvanceQuestion = async (nextIndex: number) => {
    setAdvancing(true)
    try {
      const res = await fetch(`/api/exams/${examId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextIndex }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`${nextIndex + 1}번 문항으로 전환되었습니다.`)
        fetchData()
      }
    } catch (error) {
      toast.error('문항 전환 실패')
    } finally {
      setAdvancing(false)
    }
  }

  const filteredSessions = sessions.filter(s => {
    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    const matchResult = filterResult === 'all' ||
      (filterResult === '합격' && s.isPassed === true) ||
      (filterResult === '불합격' && s.isPassed === false) ||
      (filterResult === 'PENDING' && (s.isPassed === null || s.isPassed === undefined))
    return matchStatus && matchResult
  })

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  if (!exam) return (
    <div className="p-10 text-center bg-background min-h-screen">
      <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
      <h2 className="text-xl font-bold text-foreground">정보를 찾을 수 없습니다.</h2>
      <Link href="/admin" className="text-primary underline mt-4 inline-block font-bold">
        대시보드로 돌아가기
      </Link>
    </div>
  )

  const statusInfo: any = {
    DRAFT: { label: '초안', color: 'bg-muted text-muted-foreground border-border', action: '배포하기', next: 'PUBLISHED' },
    PUBLISHED: { label: '배포됨', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', action: '시작하기', next: 'IN_PROGRESS' },
    IN_PROGRESS: { label: '진행 중', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', action: '종료하기', next: 'COMPLETED' },
    COMPLETED: { label: '종료됨', color: 'bg-foreground text-background border-foreground', action: null },
    ARCHIVED: { label: '보관됨', color: 'bg-muted/50 text-muted-foreground/50 border-border', action: null },
  }

  const currentStatusInfo = statusInfo[exam.status] || { label: exam.status, color: 'bg-muted text-muted-foreground', action: null }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 space-y-8 selection:bg-primary/20">
      {/* 상단 헤더 영역 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin')} className="h-12 w-12 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{exam.title}</h1>
              <Badge variant="outline" className={`${currentStatusInfo.color} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border`}>
                {currentStatusInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-bold italic opacity-70 uppercase tracking-widest">Live Monitor Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentStatusInfo.action && (
            <Button
              onClick={() => handleStatusUpdate(currentStatusInfo.next)}
              disabled={updatingStatus}
              className={`h-10 px-6 rounded-lg shadow-lg font-bold transition-all hover:scale-[1.02] active:scale-95 ${exam.status === 'DRAFT'
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10'
                }`}
            >
              {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {currentStatusInfo.action}
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg bg-card border-border hover:bg-muted transition-colors" title="새로고침" onClick={fetchData}>
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg bg-card border-border hover:bg-muted transition-colors" asChild title="문항 관리">
            <Link href={`/admin/exams/${examId}/questions`}>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </Link>
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg bg-card border-border hover:bg-muted transition-colors" asChild title="설정">
            <Link href={`/admin/exams/${examId}/settings`}>
              <Settings className="w-4 h-4 text-muted-foreground" />
            </Link>
          </Button>
          <div className="h-6 w-px bg-border mx-1" />
          <ThemeToggle />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* 왼쪽 메인 영역 */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: '평가 유형', value: exam.type === 'INTERVIEW' ? '비디오 면접' : exam.type === 'EXAM' ? '온라인 평가' : '하이브리드', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
              { label: '누적 응시자', value: `${exam._count?.sessions || 0}명`, icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
              { label: '합격 판정', value: `${sessions.filter(s => s.isPassed === true).length}명`, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
              { label: '불합격 판정', value: `${sessions.filter(s => s.isPassed === false).length}명`, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
            ].map((item, i) => (
              <div key={i} className={`flex flex-col gap-3 p-5 rounded-2xl bg-card shadow-sm border ${item.border} transition-all hover:shadow-xl hover:-translate-y-0.5`}>
                <div className={`p-2 w-fit rounded-lg ${item.bg}`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-lg font-bold text-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <Card className="border-border shadow-2xl bg-card rounded-[2rem] overflow-hidden ring-1 ring-border/50">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-8 pb-4 gap-4">
              <div className="flex bg-muted/50 p-1 rounded-xl border border-border">
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  onClick={() => setViewMode('list')}
                  className="rounded-lg px-4 h-8 text-xs font-bold transition-all"
                >
                  <List className="w-3.5 h-3.5 mr-1.5" />
                  리스트 뷰
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'gallery' ? 'secondary' : 'ghost'}
                  onClick={() => setViewMode('gallery')}
                  className="rounded-lg px-4 h-8 text-xs font-bold transition-all"
                >
                  <Grid className="w-3.5 h-3.5 mr-1.5" />
                  실시간 모아보기
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[130px] h-9 rounded-lg text-xs font-bold border-border bg-muted/30">
                    <SelectValue placeholder="진행 상태" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">모든 상태</SelectItem>
                    <SelectItem value="SUBMITTED">제출 완료</SelectItem>
                    <SelectItem value="IN_PROGRESS">응시 중</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterResult} onValueChange={setFilterResult}>
                  <SelectTrigger className="w-[130px] h-9 rounded-lg text-xs font-bold border-border bg-muted/30">
                    <SelectValue placeholder="결과 필터" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">모든 결과</SelectItem>
                    <SelectItem value="합격">합격</SelectItem>
                    <SelectItem value="불합격">불합격</SelectItem>
                    <SelectItem value="PENDING">심사 대기</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="p-8 pt-4 min-h-[400px]">
              {filteredSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="p-5 rounded-full bg-muted border border-border">
                    <Users className="w-8 h-8 text-muted-foreground opacity-30" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-muted-foreground opacity-70">조건에 부합하는 응시 데이터가 없습니다.</p>
                    <Button variant="link" size="sm" onClick={() => { setFilterStatus('all'); setFilterResult('all'); }} className="mt-2 text-primary font-bold">필터 초기화</Button>
                  </div>
                </div>
              ) : viewMode === 'gallery' ? (
                <AdminLiveConnection roomName={`exam-${examId}`}>
                  <LiveGallery sessions={filteredSessions} examId={examId} />
                </AdminLiveConnection>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-4 px-4 text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest w-[35%]">응시자 정보</th>
                        <th className="text-left py-4 px-4 text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest w-[25%]">진행 상태</th>
                        <th className="text-right py-4 px-4 text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest w-[30%]">최종 판정</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredSessions.map((session) => (
                        <tr
                          key={session.id}
                          className="group hover:bg-muted/30 transition-all cursor-pointer"
                          onClick={() => router.push(`/admin/exams/${examId}/sessions/${session.id}`)}
                        >
                          <td className="py-5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary border border-primary/20 shadow-sm">
                                {session.user.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{session.user.name}</p>
                                <p className="text-[10px] text-muted-foreground font-bold opacity-60">
                                  {new Date(session.submittedAt || session.startedAt || session.createdAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-4">
                            <Badge
                              variant="outline"
                              className={`
                                  rounded-full px-3 py-0.5 text-[9px] font-black tracking-tighter border
                                  ${session.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                  session.status === 'SUBMITTED' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-muted text-muted-foreground'}
                                `}
                            >
                              {session.status === 'IN_PROGRESS' ? '시험 진행 중' :
                                session.status === 'SUBMITTED' ? '최종 제출 완료' : '대기 상태'}
                            </Badge>
                          </td>
                          <td className="py-5 px-4 text-right">
                            {(session.isPassed === true) ? (
                              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3">최종 합격</Badge>
                            ) : (session.isPassed === false) ? (
                              <Badge variant="destructive" className="font-bold px-3">불합격 처리</Badge>
                            ) : (session.status === 'SUBMITTED') ? (
                              <Badge variant="secondary" className="text-blue-500 bg-blue-500/10 border-blue-500/20 font-bold px-3">심사 대기 중</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground font-bold opacity-30 italic">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 오른쪽 사이드바 */}
        <div className="space-y-8">
          {exam.isGlobalSync && (
            <Card className="border-none shadow-2xl bg-amber-600 text-white overflow-hidden relative ring-1 ring-white/10">
              <div className="absolute top-0 right-0 p-32 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50" />
              <CardHeader className="relative z-10 pb-2">
                <Badge className="w-fit bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md font-black text-[9px] tracking-widest mb-2 px-2 py-0.5">LIVE CONTROL</Badge>
                <CardTitle className="text-2xl font-black tracking-tighter">라이브 컨트롤</CardTitle>
                <CardDescription className="text-white/80 font-bold text-xs">전체 응시자의 문항을 실시간으로 제어합니다.</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-6">
                <div className="p-4 bg-black/20 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                  <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mb-1">Current Protocol Question</p>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black tracking-tighter">{exam.currentQuestionIndex + 1}</span>
                    <span className="text-xl text-white/50 font-bold mb-1">/ {questions.length}</span>
                  </div>
                  <p className="text-xs font-bold mt-3 line-clamp-1 opacity-90 italic">
                    {questions[exam.currentQuestionIndex]?.content?.replace(/<[^>]*>/g, '') || '등록된 문항이 없습니다.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-12 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white border-0 font-bold shadow-sm"
                    onClick={() => handleAdvanceQuestion(Math.max(0, exam.currentQuestionIndex - 1))}
                    disabled={advancing || exam.currentQuestionIndex === 0}
                  >
                    이전 문항
                  </Button>
                  <Button
                    className="h-12 rounded-xl bg-white text-amber-700 hover:bg-amber-50 font-black shadow-xl shadow-black/10 active:scale-95 transition-transform"
                    onClick={() => handleAdvanceQuestion(Math.min(questions.length - 1, exam.currentQuestionIndex + 1))}
                    disabled={advancing || exam.currentQuestionIndex === questions.length - 1}
                  >
                    다음으로 전환
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-8">
            {/* 초대 코드 */}
            <Card className="rounded-[2rem] border-border/50 shadow-2xl bg-card/70 backdrop-blur-xl overflow-hidden">
              <CardHeader className="px-8 py-6 border-b border-border/30 flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                    <Users className="w-6 h-6" />
                    초대 코드
                  </CardTitle>
                  <CardDescription className="text-xs font-bold mt-1">응시자 진입 키를 발급합니다</CardDescription>
                </div>
                <Button size="icon" variant="secondary" onClick={handleCreateInviteSymbol} disabled={creatingInvite} className="h-10 w-10 rounded-full shadow-sm">
                  <Plus className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 border-b border-border/30 space-y-3">
                  <div className="flex gap-2">
                    <input
                      className="flex-1 h-10 rounded-xl border border-border bg-background/60 px-3 text-sm font-bold"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="후보자 이름 (선택)"
                      disabled={creatingInvite}
                    />
                    <Button
                      variant="default"
                      className="h-10 rounded-xl font-black"
                      onClick={handleCreateInviteSymbol}
                      disabled={creatingInvite}
                    >
                      {creatingInvite ? '생성 중...' : '링크 생성'}
                    </Button>
                  </div>

                  {lastInviteUrl && (
                    <div className="p-3 rounded-xl bg-muted/30 border border-border flex items-center justify-between gap-3">
                      <div className="text-[11px] font-mono break-all text-foreground/80">{lastInviteUrl}</div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => copyText(lastInviteUrl, '전용 초대 링크가 복사되었습니다.')}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => window.open(lastInviteUrl, '_blank')}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
                  {invites.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-30 italic">
                      NO ACTIVE CODES FOUND
                    </div>
                  ) : (
                    invites.map((invite) => (
                      <div
                        key={invite.id}
                        className="group p-5 rounded-2xl bg-muted/30 border-2 border-border hover:border-primary/30 transition-all hover:bg-muted/50 hover:shadow-lg"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-mono font-black text-2xl tracking-[0.25em] text-foreground">{invite.code}</span>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 rounded-lg hover:bg-primary/10"
                              onClick={() => copyCode(invite.code)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 rounded-lg text-destructive hover:text-white hover:bg-destructive transition-colors"
                              onClick={() => deleteInvite(invite.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden border border-border">
                            <div
                              className="h-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.3)]"
                              style={{ width: `${(invite.usedCount / invite.maxUses) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-black text-muted-foreground tabular-nums">
                            {invite.usedCount}/{invite.maxUses}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
              <div className="bg-muted/30 p-4 border-t border-border text-center">
                <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider opacity-60">Authorized Use Only // Secure Key Generation v2.0</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminLiveConnection({ roomName, children }: { roomName: string, children: React.ReactNode }) {
  const [token, setToken] = useState('')

  useEffect(() => {
    (async () => {
      if (!roomName) return
      try {
        const resp = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName }),
        })
        const data = await resp.json()
        setToken(data.token)
      } catch (e) {
        console.error(e)
      }
    })()
  }, [roomName])

  if (!token) return (
    <div className="p-20 text-center space-y-4 animate-pulse">
      <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto opacity-20" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Connecting to Live Server...</p>
    </div>
  )

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect={true}
    >
      {children}
    </LiveKitRoom>
  )
}

function LiveGallery({ sessions, examId }: { sessions: any[], examId: string }) {
  const tracks = useTracks([Track.Source.Camera])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in">
      {sessions.map((session) => {
        const track = tracks.find(t => t.participant.identity === session.userId)

        return (
          <Link href={`/admin/exams/${examId}/sessions/${session.id}`} key={session.id}>
            <div className="group relative bg-card rounded-2xl p-4 border border-border hover:border-primary/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 space-y-4 ring-1 ring-border/50">
              <div className="aspect-video bg-muted/50 rounded-xl overflow-hidden relative shadow-inner">
                {track ? (
                  <VideoTrack trackRef={track} className="w-full h-full object-cover" />
                ) : (session.recordingUrl || session.recordings?.[0]?.url) ? (
                  <div className="w-full h-full flex items-center justify-center bg-black/90">
                    <video
                      src={session.recordingUrl || session.recordings?.[0]?.url}
                      className="w-full h-full object-cover opacity-50 transition-opacity group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/10 transition-all">
                      <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center ring-1 ring-white/20">
                        <Play className="w-5 h-5 text-white/80 fill-white/80" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground font-black uppercase tracking-widest italic animate-pulse">
                    {session.status === 'IN_PROGRESS' ? 'STREAM STARTING...' : 'SIGNAL OFFLINE'}
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {track && (
                    <Badge variant="destructive" className="text-[8px] font-black h-5 px-2 shadow-xl animate-pulse ring-1 ring-white/10">
                      LIVE
                    </Badge>
                  )}
                  <Badge className={`text-[8px] font-black h-5 px-2 shadow-xl ring-1 ring-white/10 ${session.status === 'IN_PROGRESS' ? 'bg-primary' : 'bg-muted-foreground'}`}>
                    {session.status === 'IN_PROGRESS' ? '응시 중' : '제출 완료'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between px-1">
                <div>
                  <p className="font-extrabold text-sm text-foreground group-hover:text-primary transition-colors leading-tight">{session.user.name}</p>
                  <p className="text-[10px] text-muted-foreground font-bold italic opacity-60 mt-0.5 tabular-nums">
                    {new Date(session.submittedAt || session.startedAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 font-black text-[10px] text-primary uppercase tracking-tighter">
                    {session.status === 'SUBMITTED' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    )}
                    {session.status === 'SUBMITTED' ? '기록됨' : 'ACT'}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
