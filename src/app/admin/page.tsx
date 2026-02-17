'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ExamType } from '@/types'
import { useAuthStore } from '@/stores/auth-store'
import {
  Plus,
  FileText,
  Users,
  Clock,
  BarChart3,
  Settings,
  LogOut,
  GraduationCap,
  Eye,
  Copy,
  Check,
  Trash2,
  Timer,
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

interface ExamWithStats {
  id: string
  title: string
  description?: string
  type: 'INTERVIEW' | 'EXAM' | 'HYBRID'
  status: 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED'
  duration: number
  isGlobalSync: boolean
  createdAt: string
  stats: {
    totalCandidates: number
    submitted: number
    inProgress: number
    waiting: number
    questionCount: number
  }
  inviteCodes?: { code: string }[]
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [exams, setExams] = useState<ExamWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // 새 시험 폼
  const [newExam, setNewExam] = useState({
    title: '',
    description: '',
    type: 'EXAM' as ExamType,
    duration: 60,
  })

  // 시험 목록 불러오기
  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams')
      const data = await res.json()
      if (data.success) {
        setExams(data.exams)
      }
    } catch (error) {
      console.error('Fetch exams error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExams()
  }, [])

  // 시험 생성
  const handleCreateExam = async () => {
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExam),
      })
      const data = await res.json()

      if (data.success) {
        setCreateDialogOpen(false)
        setNewExam({ title: '', description: '', type: 'EXAM', duration: 60 })
        fetchExams()
      }
    } catch (error) {
      console.error('Create exam error:', error)
    }
  }

  // 초대 코드 복사
  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success('초대 코드가 복사되었습니다.')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // 시험 상태 변경
  const handleStatusUpdate = async (examId: string, status: string) => {
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) {
        fetchExams()
      }
    } catch (error) {
      console.error('Update status error:', error)
    }
  }

  // 시험 삭제
  const handleDeleteExam = async (examId: string) => {
    if (!confirm('정말 이 시험을 삭제하시겠습니까? 관련 데이터(응시 기록, 초대 코드 등)가 모두 삭제됩니다.')) return
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        fetchExams()
      } else {
        alert(data.error || '삭제 실패')
      }
    } catch (error) {
      console.error('Delete exam error:', error)
    }
  }

  // 로그아웃
  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  // 상태 배지 색상
  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      DRAFT: 'secondary',
      PUBLISHED: 'default',
      IN_PROGRESS: 'default',
      COMPLETED: 'outline',
      ARCHIVED: 'secondary',
    }
    const labels: Record<string, string> = {
      DRAFT: '작성중',
      PUBLISHED: '게시됨',
      IN_PROGRESS: '진행중',
      COMPLETED: '완료',
      ARCHIVED: '보관됨',
    }
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  // 타입 배지
  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      INTERVIEW: 'AI 면접',
      EXAM: '시험',
      HYBRID: '혼합',
    }
    return <Badge variant="outline">{labels[type]}</Badge>
  }

  // 통계 카드
  const totalCandidates = exams.reduce((sum, e) => sum + e.stats.totalCandidates, 0)
  const activeExams = exams.filter((e) => e.status === 'PUBLISHED' || e.status === 'IN_PROGRESS').length
  const totalQuestions = exams.reduce((sum, e) => sum + e.stats.questionCount, 0)

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => router.push('/admin')}>
            <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-all">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">DY-INTERVIEW</h1>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Enterprise Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium">{user?.name}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{user?.role}</span>
            </div>
            <div className="flex items-center gap-2 border-l pl-6">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleLogout} className="hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 space-y-10">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: '전체 시험', value: exams.length, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: '진행중인 시험', value: activeExams, icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: '전체 응시자', value: totalCandidates, icon: Users, color: 'text-violet-500', bg: 'bg-violet-500/10' },
            { label: '전체 문항', value: totalQuestions, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          ].map((stat, i) => (
            <Card key={i} className="glass animate-in group hover:border-primary/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300" style={{ animationDelay: `${i * 100}ms` }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className={`p-3 ${stat.bg} ${stat.color} rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 시험 목록 */}
        <Card className="glass animate-in shadow-xl" style={{ animationDelay: '400ms' }}>
          <CardHeader className="flex flex-row items-center justify-between border-b bg-card/50 px-8 py-6">
            <div>
              <CardTitle className="text-xl font-bold">시험/면접 목록</CardTitle>
              <CardDescription className="mt-1">생성된 시험 및 면접을 관리합니다.</CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                  <Plus className="w-4 h-4 mr-2" />
                  새 시험 만들기
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] glass p-0 overflow-hidden">
                <div className="bg-primary/5 p-8 border-b">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">새 시험/면접 만들기</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      새로운 시험 또는 AI 면접을 위한 설정을 시작합니다.
                    </DialogDescription>
                  </DialogHeader>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">시험 제목</Label>
                    <Input
                      value={newExam.title}
                      onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                      placeholder="예: 2025년 1분기 개발자 면접"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">설명</Label>
                    <Textarea
                      value={newExam.description}
                      onChange={(e) => setNewExam({ ...newExam, description: e.target.value })}
                      placeholder="시험에 대한 설명을 입력하세요"
                      className="bg-background/50 min-h-[100px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">유형</Label>
                      <Select
                        value={newExam.type}
                        onValueChange={(value) => setNewExam({ ...newExam, type: value as ExamType })}
                      >
                        <SelectTrigger className="bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EXAM">온라인 시험</SelectItem>
                          <SelectItem value="INTERVIEW">AI 면접</SelectItem>
                          <SelectItem value="HYBRID">혼합</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">제한 시간 (분)</Label>
                      <Input
                        type="number"
                        value={newExam.duration}
                        onChange={(e) => setNewExam({ ...newExam, duration: parseInt(e.target.value) || 60 })}
                        className="bg-background/50"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 p-8 pt-4 bg-muted/30">
                  <Button variant="ghost" onClick={() => setCreateDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleCreateExam} disabled={!newExam.title.trim()} className="px-8">
                    생성하기
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                로딩 중...
              </div>
            ) : exams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                아직 생성된 시험이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[1000px]">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="px-8 py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">시험명</TableHead>
                        <TableHead className="py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">유형</TableHead>
                        <TableHead className="py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">상태</TableHead>
                        <TableHead className="py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">응시자 현황</TableHead>
                        <TableHead className="py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">문항</TableHead>
                        <TableHead className="py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">초대코드</TableHead>
                        <TableHead className="py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">생성일</TableHead>
                        <TableHead className="px-8 py-4 text-right font-bold text-xs uppercase tracking-widest text-muted-foreground">액션</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exams.map((exam, i) => (
                        <TableRow key={exam.id} className="group hover:bg-primary/[0.02] border-b border-border/50 transition-colors">
                          <TableCell className="px-8 py-6">
                            <div className="font-semibold text-base group-hover:text-primary transition-colors">{exam.title}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{exam.description || 'No description'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {getTypeBadge(exam.type)}
                              {exam.isGlobalSync && (
                                <Badge variant="outline" className="w-fit border-amber-500/50 text-amber-500 bg-amber-500/10 gap-1 text-[9px] py-0 px-1">
                                  <Timer className="w-2.5 h-2.5" />
                                  SYNC
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(exam.status)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary"
                                    style={{ width: `${exam.stats.totalCandidates > 0 ? (exam.stats.submitted / exam.stats.totalCandidates) * 100 : 0}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium">{exam.stats.submitted} / {exam.stats.totalCandidates}</span>
                              </div>
                              <div className="flex gap-2 text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />진행 {exam.stats.inProgress}</span>
                                <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-400" />대기 {exam.stats.waiting}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="font-medium text-sm">{exam.stats.questionCount}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {exam.inviteCodes?.[0]?.code ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => copyInviteCode(exam.inviteCodes![0].code)}
                                className="font-mono text-xs h-7 px-3 bg-muted/40 hover:bg-muted/60"
                              >
                                {exam.inviteCodes[0].code}
                                {copiedCode === exam.inviteCodes[0].code ? (
                                  <Check className="w-3 h-3 ml-2 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3 ml-2 opacity-50" />
                                )}
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">코드 없음</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {new Date(exam.createdAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
                          </TableCell>
                          <TableCell className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <div className="flex items-center gap-1 mr-2 border-r pr-2 border-border/50">
                                {exam.status === 'DRAFT' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs bg-primary/5 hover:bg-primary text-primary hover:text-white border-primary/20 transition-all font-semibold"
                                    onClick={() => handleStatusUpdate(exam.id, 'PUBLISHED')}
                                  >
                                    게시
                                  </Button>
                                )}
                                {exam.status === 'PUBLISHED' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs bg-emerald-500/5 hover:bg-emerald-500 text-emerald-500 hover:text-white border-emerald-500/20 transition-all font-semibold"
                                    onClick={() => handleStatusUpdate(exam.id, 'IN_PROGRESS')}
                                  >
                                    시작
                                  </Button>
                                )}
                                {exam.status === 'IN_PROGRESS' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs bg-amber-500/5 hover:bg-amber-500 text-amber-500 hover:text-white border-amber-500/20 transition-all font-semibold"
                                    onClick={() => handleStatusUpdate(exam.id, 'COMPLETED')}
                                  >
                                    종료
                                  </Button>
                                )}
                              </div>

                              <Button variant="ghost" size="icon" asChild className="h-8 w-8 hover:bg-primary/10 hover:text-primary" title="상세 보기">
                                <Link href={`/admin/exams/${exam.id}`}>
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" asChild className="h-8 w-8 hover:bg-primary/10 hover:text-primary" title="설정">
                                <Link href={`/admin/exams/${exam.id}/settings`}>
                                  <Settings className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleDeleteExam(exam.id)}
                                title="삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
