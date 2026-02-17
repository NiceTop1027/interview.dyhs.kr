'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth-store'
import { GraduationCap, KeyRound, User, AlertCircle, Shield, Video, Brain, CheckCircle, TrendingUp, Users, Lock, Globe, Award } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'candidate' | 'admin'>('candidate')

  // 응시자 입장
  const [inviteCode, setInviteCode] = useState('')
  const [candidateName, setCandidateName] = useState('')
  const [candidateError, setCandidateError] = useState('')
  const [candidateLoading, setCandidateLoading] = useState(false)

  // 관리자 로그인
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminError, setAdminError] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)

  const { loginWithCode, login } = useAuthStore()

  // 응시자 입장 처리
  const handleCandidateEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    setCandidateError('')

    if (!inviteCode.trim()) {
      setCandidateError('초대 코드를 입력해주세요.')
      return
    }
    if (!candidateName.trim()) {
      setCandidateError('이름을 입력해주세요.')
      return
    }

    setCandidateLoading(true)
    try {
      const result = await loginWithCode(inviteCode.trim(), candidateName.trim())
      if (result.success && result.examId) {
        router.push(`/exam/${result.examId}/waiting`)
      } else {
        setCandidateError(result.error || '유효하지 않은 초대 코드입니다.')
      }
    } catch {
      setCandidateError('입장 처리 중 오류가 발생했습니다.')
    } finally {
      setCandidateLoading(false)
    }
  }

  // 관리자 로그인 처리
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdminError('')

    if (!adminEmail.trim() || !adminPassword.trim()) {
      setAdminError('이메일과 비밀번호를 입력해주세요.')
      return
    }

    setAdminLoading(true)
    try {
      const success = await login(adminEmail.trim(), adminPassword)
      if (success) {
        router.push('/admin')
      } else {
        setAdminError('이메일 또는 비밀번호가 올바르지 않습니다.')
      }
    } catch {
      setAdminError('로그인 처리 중 오류가 발생했습니다.')
    } finally {
      setAdminLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* 헤더 */}
      <header className="border-b bg-background/95 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-primary/80 p-2 rounded-xl shadow-xl shadow-primary/20">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tighter">DY-<span className="text-primary">INTERVIEW</span></span>
              <p className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-wider">Enterprise Assessment Platform</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary">Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10">
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary">Cloud-Based Platform</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-20">
        <div className="max-w-7xl mx-auto">
          {/* 히어로 섹션 */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24 animate-in">
            <div className="text-center lg:text-left space-y-8">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-primary text-[11px] font-bold uppercase tracking-widest">
                <Brain className="w-4 h-4" />
                Powered by Advanced AI Technology
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
                차세대 AI 기반<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/60">
                  평가 플랫폼
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl lg:max-w-none mx-auto lg:mx-0 leading-relaxed font-medium">
                최첨단 비전 AI와 대규모 언어 모델을 결합하여<br className="hidden md:block" />
                공정하고 지능적인 평가 환경을 제공합니다
              </p>

              {/* 주요 특징 */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                {['실시간 프록터링', 'AI 면접관', '부정행위 감지', '자동 채점'].map((feature, i) => (
                  <Badge key={i} variant="outline" className="px-4 py-2 text-sm font-bold border-2">
                    <CheckCircle className="w-3.5 h-3.5 mr-2 text-primary" />
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 로그인/입장 카드 */}
            <div className="animate-in lg:ml-auto w-full" style={{ animationDelay: '200ms' }}>
              <Card className="glass overflow-hidden max-w-xl mx-auto shadow-2xl border-2">
                <CardHeader className="text-center bg-gradient-to-br from-primary/5 to-primary/10 py-14 relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/20 mb-6">
                      <KeyRound className="w-10 h-10 text-primary" />
                    </div>
                    <CardTitle className="text-4xl font-black mb-3">시스템 접속</CardTitle>
                    <CardDescription className="font-bold text-base">
                      인증 정보를 입력하여 평가 시스템에 접속하세요
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-10">
                  <div className="space-y-8">
                    <div className="grid w-full grid-cols-2 h-14 bg-muted/60 text-muted-foreground rounded-xl p-1 shadow-xs border border-border/60">
                      <button
                        onClick={() => setActiveTab('candidate')}
                        className={`
                          flex items-center justify-center gap-2 rounded-lg text-sm font-black transition-all
                          ${activeTab === 'candidate'
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm'
                            : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'}
                        `}
                      >
                        <User className="w-5 h-5" />
                        CANDIDATE
                      </button>
                      <button
                        onClick={() => setActiveTab('admin')}
                        className={`
                          flex items-center justify-center gap-2 rounded-lg text-sm font-black transition-all
                          ${activeTab === 'admin'
                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm'
                            : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'}
                        `}
                      >
                        <Shield className="w-5 h-5" />
                        ADMIN
                      </button>
                    </div>

                    {/* 응시자 입장 */}
                    {activeTab === 'candidate' && (
                      <div className="space-y-7 min-h-[320px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <form onSubmit={handleCandidateEntry} className="space-y-7">
                          <div className="space-y-4">
                            <Label htmlFor="inviteCode" className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">Invite Protocol Key</Label>
                            <Input
                              id="inviteCode"
                              placeholder="CODE-XXXX"
                              value={inviteCode}
                              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                              className="text-center text-xl font-black bg-muted/20 h-16 rounded-2xl border-none focus-visible:ring-primary/20 tabular-nums font-mono tracking-[0.18em] uppercase"
                              maxLength={12}
                            />
                          </div>
                          <div className="space-y-4">
                            <Label htmlFor="candidateName" className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">Registered Full Name</Label>
                            <Input
                              id="candidateName"
                              placeholder="Your Name"
                              value={candidateName}
                              onChange={(e) => setCandidateName(e.target.value)}
                              className="text-center text-xl font-black bg-muted/20 h-16 rounded-2xl border-none"
                            />
                          </div>

                          {candidateError && (
                            <Alert variant="destructive" className="bg-destructive/10 border-none text-destructive">
                              <AlertCircle className="w-4 h-4" />
                              <AlertDescription className="font-bold">{candidateError}</AlertDescription>
                            </Alert>
                          )}

                          <Button type="submit" className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 font-black text-xl transition-all active:scale-95" disabled={candidateLoading}>
                            {candidateLoading ? 'VERIFYING...' : 'INITIATE SESSION'}
                          </Button>
                        </form>
                      </div>
                    )}

                    {/* 관리자 로그인 */}
                    {activeTab === 'admin' && (
                      <div className="space-y-7 min-h-[320px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <form onSubmit={handleAdminLogin} className="space-y-7">
                          <div className="space-y-4">
                            <Label htmlFor="adminEmail" className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">Administrator Email</Label>
                            <Input
                              id="adminEmail"
                              type="email"
                              placeholder="admin@nicetop.ai"
                              value={adminEmail}
                              onChange={(e) => setAdminEmail(e.target.value)}
                              className="text-center text-xl font-black bg-muted/20 h-16 rounded-2xl border-none"
                            />
                          </div>
                          <div className="space-y-4">
                            <Label htmlFor="adminPassword" className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">Secure Password</Label>
                            <Input
                              id="adminPassword"
                              type="password"
                              placeholder="••••••••"
                              value={adminPassword}
                              onChange={(e) => setAdminPassword(e.target.value)}
                              className="text-center text-xl font-black bg-muted/20 h-16 rounded-2xl border-none"
                            />
                          </div>

                          {adminError && (
                            <Alert variant="destructive" className="bg-destructive/10 border-none text-destructive">
                              <AlertCircle className="w-4 h-4" />
                              <AlertDescription className="font-bold">{adminError}</AlertDescription>
                            </Alert>
                          )}

                          <Button type="submit" className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 font-black text-xl transition-all active:scale-95" disabled={adminLoading}>
                            {adminLoading ? 'AUTHENTICATING...' : 'ACCESS DASHBOARD'}
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 기능 소개 */}
          <div className="mb-24">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-4">핵심 기능</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                AI 기술로 구현된 차세대 평가 시스템의 주요 기능을 확인하세요
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="glass animate-in hover-lift group border-2 hover:border-primary/30 transition-all" style={{ animationDelay: '100ms' }}>
                <CardContent className="p-8 text-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full group-hover:bg-blue-500/30 transition-all" />
                    <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 flex items-center justify-center mx-auto border-2 border-blue-500/20 group-hover:scale-110 transition-transform shadow-xl">
                      <Brain className="w-10 h-10 text-blue-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black mb-3">AI 면접관</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      대규모 언어 모델 기반의 AI가 지원자의 답변을 분석하고
                      실시간으로 심층 질문을 생성합니다
                    </p>
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-500">
                      <TrendingUp className="w-4 h-4" />
                      실시간 응답 분석
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass animate-in hover-lift group border-2 hover:border-primary/30 transition-all" style={{ animationDelay: '200ms' }}>
                <CardContent className="p-8 text-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full group-hover:bg-red-500/30 transition-all" />
                    <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500/10 to-red-500/5 flex items-center justify-center mx-auto border-2 border-red-500/20 group-hover:scale-110 transition-transform shadow-xl">
                      <Shield className="w-10 h-10 text-red-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black mb-3">비전 프록터링</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      컴퓨터 비전 기술로 시선 추적 및 이상 행동을
                      실시간 감지하여 평가의 공정성을 확보합니다
                    </p>
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-red-500">
                      <Shield className="w-4 h-4" />
                      부정행위 자동 감지
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass animate-in hover-lift group border-2 hover:border-primary/30 transition-all" style={{ animationDelay: '300ms' }}>
                <CardContent className="p-8 text-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full group-hover:bg-emerald-500/30 transition-all" />
                    <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center mx-auto border-2 border-emerald-500/20 group-hover:scale-110 transition-transform shadow-xl">
                      <Video className="w-10 h-10 text-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black mb-3">고급 분석</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      응시 데이터를 AI로 분석하여 상세한 평가 리포트를
                      제공하고 최적의 의사결정을 지원합니다
                    </p>
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-500">
                      <Award className="w-4 h-4" />
                      데이터 기반 인사이트
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>


        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t mt-24 bg-muted/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-primary to-primary/80 p-2 rounded-xl shadow-xl shadow-primary/20">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-black tracking-tighter">NICETOP <span className="text-primary">AI</span></span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI 기술 기반의 차세대<br />
                엔터프라이즈 평가 플랫폼
              </p>
            </div>

            <div>
              <h4 className="font-black text-sm mb-4 uppercase tracking-wider">플랫폼</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">AI 면접</li>
                <li className="hover:text-primary transition-colors cursor-pointer">온라인 시험</li>
                <li className="hover:text-primary transition-colors cursor-pointer">프록터링</li>
                <li className="hover:text-primary transition-colors cursor-pointer">분석 대시보드</li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-sm mb-4 uppercase tracking-wider">기업</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">보안 정책</li>
                <li className="hover:text-primary transition-colors cursor-pointer">개인정보 처리방침</li>
                <li className="hover:text-primary transition-colors cursor-pointer">이용약관</li>
                <li className="hover:text-primary transition-colors cursor-pointer">문의하기</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">&copy; 2026 DY-INTERVIEW. All rights reserved. (Rev: 20260106-V4-FIX)</p>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs">
                <Lock className="w-3 h-3 mr-1" />
                Enterprise Security
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Globe className="w-3 h-3 mr-1" />
                Cloud Platform
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
