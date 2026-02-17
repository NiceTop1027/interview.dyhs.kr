'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Save, Loader2, Sparkles, ShieldAlert, Clock, Settings2, Timer, Video } from 'lucide-react'

export default function AdminExamSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params?.examId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exam, setExam] = useState<any>(null)

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await fetch(`/api/exams/${examId}`)
        const data = await res.json()
        if (data.success) {
          setExam(data.exam)
        } else {
          toast.error(data.error || '시험 정보를 불러오는데 실패했습니다.')
        }
      } catch (error) {
        console.error('Fetch exam error:', error)
        toast.error('오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    if (examId) fetchExam()
  }, [examId])

  const handleUpdate = async (field: string, value: any) => {
    setExam((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exam),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('설정이 저장되었습니다.')
        router.refresh()
      } else {
        toast.error(data.error || '저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('Save settings error:', error)
      toast.error('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="p-10 text-center bg-background min-h-screen flex flex-col items-center justify-center">
        <p className="font-bold text-muted-foreground">시험 정보를 찾을 수 없습니다.</p>
        <Link href="/admin" className="text-primary underline mt-4 inline-block font-bold">
          목록으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-6 max-w-5xl space-y-10 selection:bg-primary/10 text-foreground">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-12 w-12 rounded-2xl bg-card border border-border hover:bg-muted transition-all shadow-sm">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">상세 설정</h1>
            <p className="text-lg text-muted-foreground mt-1 font-medium">
              <span className="font-bold text-primary">{exam.title}</span> 프로젝트의 운영 정책을 관리합니다.
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-12 px-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-bold active:translate-y-px"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          변경 사항 저장
        </Button>
      </div>

      <div className="grid gap-8">
        {/* 기본 정보 */}
        <Card className="glass animate-in" style={{ animationDelay: '100ms' }}>
          <CardHeader className="bg-muted/30 px-8 py-6 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                <Settings2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">기본 정보 및 유형</CardTitle>
                <CardDescription className="text-muted-foreground font-medium italic opacity-70">평가의 핵심 식별 정보와 진행 유형을 정의합니다.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">평가 제목</Label>
              <Input
                id="title"
                value={exam.title}
                onChange={(e) => handleUpdate('title', e.target.value)}
                className="bg-muted/30 border-border h-12 font-bold text-lg focus:ring-primary/20"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="description" className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">응시자 안내 가이드</Label>
              <Textarea
                id="description"
                value={exam.description || ''}
                onChange={(e) => handleUpdate('description', e.target.value)}
                placeholder="응시자 대기화면에 표시될 최종 안내 문구를 상세히 입력하십시오."
                className="bg-muted/30 border-border min-h-[140px] leading-relaxed font-medium focus:ring-primary/20"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">평가 엔진 모드</Label>
                <Select
                  value={exam.type}
                  onValueChange={(val) => handleUpdate('type', val)}
                >
                  <SelectTrigger className="bg-muted/30 border-border h-12 font-bold focus:ring-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border shadow-2xl">
                    <SelectItem value="EXAM">온라인 시험 (EXAM MODE)</SelectItem>
                    <SelectItem value="INTERVIEW">비디오 면접 (VIDEO PORTAL)</SelectItem>
                    <SelectItem value="HYBRID">하이브리드 (HYBRID MODE)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label htmlFor="duration" className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">제한 시간 (분)</Label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-50" />
                  <Input
                    id="duration"
                    type="number"
                    value={exam.duration}
                    onChange={(e) => handleUpdate('duration', parseInt(e.target.value) || 0)}
                    className="bg-muted/30 border-border h-12 pl-12 font-bold focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 운영 모드 및 동기화 설정 */}
        <Card className="glass animate-in" style={{ animationDelay: '200ms' }}>
          <CardHeader className="bg-amber-500/5 px-8 py-6 border-b border-amber-500/10">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <Timer className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">운영 모드 및 동기화</CardTitle>
                <CardDescription className="text-muted-foreground font-medium italic opacity-70">실시간 글로벌 동기화 및 문항 진행 방식을 제어합니다.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between group p-5 rounded-2xl bg-muted/20 hover:bg-muted/30 transition-all border border-border shadow-inner">
              <div className="space-y-1 pr-8">
                <Label className="text-base font-black text-amber-600 uppercase tracking-tight leading-tight">글로벌 실시간 동기화 (CONTEST MODE)</Label>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed mt-1">
                  활성화 시 관리자가 문항을 직접 제어하며, 모든 응시자의 화면이 동시에 동기화됩니다. 타이머 신호 또한 서버 기준으로 일괄 적용됩니다.
                </p>
              </div>
              <Switch
                checked={exam.isGlobalSync}
                onCheckedChange={(val) => handleUpdate('isGlobalSync', val)}
                className="data-[state=checked]:bg-amber-500 shadow-sm"
              />
            </div>

            {exam.isGlobalSync && (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-4 items-start animate-in">
                <div className="p-2 bg-amber-500/20 rounded-full shrink-0">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-amber-600">콘테스트 모드 활성 중</p>
                  <p className="text-[11px] text-amber-700 font-bold leading-relaxed opacity-80">
                    참가자는 스스로 문항을 넘길 수 없으며, 관리자가 '대시보드'에서 직접 다음 세션으로 진입시켜야 합니다.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 보안 및 프록터링 */}
        <Card className="border-border shadow-2xl bg-card rounded-[2rem] overflow-hidden ring-1 ring-border/50 animate-in" style={{ animationDelay: '300ms' }}>
          <CardHeader className="bg-destructive/5 px-8 py-6 border-b border-destructive/10">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-destructive/10 rounded-xl border border-destructive/20">
                <ShieldAlert className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">보안 정책 및 프록터링</CardTitle>
                <CardDescription className="text-muted-foreground font-medium italic opacity-70">공정하고 신뢰할 수 있는 평가 환경을 위한 기술적 제어 도구입니다.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="group p-5 rounded-2xl bg-muted/20 hover:bg-muted/30 transition-all border border-border shadow-inner flex flex-col justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold text-foreground">AI 시선 유출 및 패턴 분석</Label>
                    <Switch
                      checked={exam.enableCheatingDetection}
                      onCheckedChange={(val) => handleUpdate('enableCheatingDetection', val)}
                      className="data-[state=checked]:bg-destructive/80"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium leading-relaxed opacity-70">실시간 비전 분석을 통해 자리 비움 또는 시선 유출을 감지하여 로그를 생성합니다.</p>
                </div>
              </div>
              <div className="group p-5 rounded-2xl bg-muted/20 hover:bg-muted/30 transition-all border border-border shadow-inner flex flex-col justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold text-foreground">무단 복사 및 붙여넣기 차단</Label>
                    <Switch
                      checked={exam.preventCopyPaste}
                      onCheckedChange={(val) => handleUpdate('preventCopyPaste', val)}
                      className="data-[state=checked]:bg-destructive/80"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium leading-relaxed opacity-70">클립보드 API를 제어하여 문항 외부 유출 및 코드 복사 붙여넣기를 원천 차단합니다.</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="group p-4 rounded-xl bg-card border border-border flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <Video className="w-4 h-4 text-muted-foreground opacity-50" />
                  <span className="text-xs font-bold">실시간 웹캠 스트리밍 의무화</span>
                </div>
                <Switch
                  checked={exam.enableCamera}
                  onCheckedChange={(val) => handleUpdate('enableCamera', val)}
                  className="scale-90"
                />
              </div>
              <div className="group p-4 rounded-xl bg-card border border-border flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4 text-muted-foreground opacity-50" />
                  <span className="text-xs font-bold">오디오 데이터 샘플링 수집</span>
                </div>
                <Switch
                  checked={exam.enableMicrophone}
                  onCheckedChange={(val) => handleUpdate('enableMicrophone', val)}
                  className="scale-90"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 결과 관리 */}
        <Card className="border-border shadow-2xl bg-card rounded-[2rem] overflow-hidden ring-1 ring-border/50 animate-in" style={{ animationDelay: '400ms' }}>
          <CardHeader className="bg-muted/30 px-8 py-6 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-foreground/10 rounded-xl border border-foreground/20">
                <Sparkles className="w-5 h-5 text-foreground opacity-70" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">평가 결과 및 리포트 정책</CardTitle>
                <CardDescription className="text-muted-foreground font-medium italic opacity-70">응시 후 데이터 처리 방식과 결과 공개 여부를 결정합니다.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="flex items-center justify-between group p-5 rounded-2xl bg-muted/20 hover:bg-muted/30 transition-all border border-border shadow-inner">
              <div className="space-y-1 pr-8">
                <Label className="text-base font-bold text-foreground">결과 즉시 공개 (Self-Reading)</Label>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed mt-1">제출 즉시 응시자에게 최종 점수와 문항별 해설 상세 리포트를 상시 노출합니다.</p>
              </div>
              <Switch
                checked={exam.showResultImmediately}
                onCheckedChange={(val) => handleUpdate('showResultImmediately', val)}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            <div className="bg-muted/10 p-5 rounded-2xl border border-border/50 max-w-sm">
              <Label htmlFor="passingScore" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 block">합격 커트라인 (Score Cut-off)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="passingScore"
                  type="number"
                  value={exam.passingScore || ''}
                  onChange={(e) => handleUpdate('passingScore', parseInt(e.target.value) || 0)}
                  placeholder="예: 70"
                  className="bg-card border-border h-12 font-black text-2xl w-24 text-center focus:ring-primary/20"
                />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground opacity-70">점수 미달 시 자동 불합격</p>
                  <p className="text-[10px] text-muted-foreground font-medium">이 기준점을 넘지 못하면 결과가 즉시 '불합격'으로 표기됩니다.</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 py-4 px-8 border-t flex items-center justify-between">
            <span>Last Control Synchronization: SYNC_OK</span>
            <span>Update ID: {new Date(exam.updatedAt).getTime()}</span>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
