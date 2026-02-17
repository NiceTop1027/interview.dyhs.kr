'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import {
    Building2,
    ChevronRight,
    ShieldCheck,
    Zap,
    Users,
    Globe,
    Video,
    Layers,
    CheckCircle2,
    Cpu,
    BarChart3,
    Lock
} from 'lucide-react'

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
            {/* GNB */}
            <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-7xl">
                    <Link href="/" className="flex items-center gap-2.5 group transition-all hover:opacity-80">
                        <div className="bg-primary p-2 rounded-md shadow-lg shadow-primary/20">
                            <Building2 className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black tracking-tighter leading-none text-foreground">NICETOP</span>
                            <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Enterprise Portal</span>
                        </div>
                    </Link>
                    <div className="flex items-center gap-8 text-sm font-bold text-muted-foreground">
                        <Link href="/" className="hover:text-foreground cursor-pointer transition-colors">홈으로</Link>
                        <div className="border-l pl-8 h-4 border-border" />
                        <Link href="/" className="md:inline-block hidden">
                            <Button size="sm" className="font-bold rounded-lg shadow-lg shadow-primary/10 transition-all hover:scale-105 active:scale-95">
                                지금 시작하기
                            </Button>
                        </Link>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main>
                {/* 히어로 섹션 */}
                <section className="relative py-24 overflow-hidden border-b border-border">
                    <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_top,rgba(var(--primary-rgb),0.15),transparent)] pointer-events-none" />

                    <div className="container mx-auto px-6 max-w-7xl relative z-10">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8 animate-in text-left">
                                <BadgeSection text="Next-Generation Enterprise Assessment" />
                                <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-[1.1]">
                                    기업 채용의 <br />
                                    <span className="text-primary text-glow">데이터 혁명</span>
                                </h1>
                                <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-xl">
                                    NiceTop은 단순한 시험 툴이 아닙니다. AI 기반 프록터링과
                                    정밀한 응시 데이터 분석을 통해, 귀사의 미래를 책임질 핵심 인재를
                                    가장 정교하게 선별해내는 엔터프라이즈 솔루션입니다.
                                </p>
                                <div className="flex flex-wrap gap-4 pt-4">
                                    <Link href="/">
                                        <Button size="lg" className="h-14 px-8 rounded-2xl font-black text-lg shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
                                            엔터프라이즈 데모 시작
                                            <ChevronRight className="w-5 h-5 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            <div className="relative group animate-in" style={{ animationDelay: '200ms' }}>
                                <div className="absolute -inset-4 bg-primary/20 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                <Card className="relative aspect-video rounded-[2.5rem] border-border/50 shadow-2xl overflow-hidden glass ring-1 ring-border/50">
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <div className="text-white text-center">
                                            <div className="text-4xl font-bold mb-2">DY-INTERVIEW</div>
                                            <div className="text-sm opacity-80">AI Assessment Platform</div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 핵심 가치 섹션 */}
                <section className="py-24 bg-muted/20">
                    <div className="container mx-auto px-6 max-w-7xl">
                        <div className="text-center space-y-4 mb-20 animate-in">
                            <h2 className="text-xs font-black text-primary tracking-[0.3em] uppercase">Enterprise Values</h2>
                            <h3 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">완벽한 평가를 위한 설계</h3>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <ValueCard
                                icon={ShieldCheck}
                                title="기술적 정직성"
                                description="AI 기반 시선 추적과 실시간 탭 차단 기술이 응시 과정의 모든 순간을 투명하고 공정하게 기록합니다."
                            />
                            <ValueCard
                                icon={Zap}
                                title="압도적 안정성"
                                description="전 세계 어디서든 수천 명의 동시 접속자가 지연 없는 고화질 비디오 스트리밍을 경험할 수 있는 분산 환경을 제공합니다."
                            />
                            <ValueCard
                                icon={BarChart3}
                                title="데이터 통찰력"
                                description="단순한 점수가 아닌, 응시자의 행동 분석을 통한 다각도 역량 지표를 제공하여 더 나은 의사결정을 지원합니다."
                            />
                        </div>
                    </div>
                </section>

                {/* 보안 및 AI 섹션 */}
                <section className="py-24 border-t border-border">
                    <div className="container mx-auto px-6 max-w-7xl">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="order-2 lg:order-1 relative animate-in">
                                <Card className="aspect-square rounded-[3rem] overflow-hidden border-none shadow-2xl ring-1 ring-border/50">
                                    <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                                        <div className="text-white text-center">
                                            <div className="text-6xl mb-2">🛡️</div>
                                            <div className="text-lg font-bold">Security First</div>
                                            <div className="text-sm opacity-80">Enterprise Protection</div>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            <div className="order-1 lg:order-2 space-y-10 animate-in text-left">
                                <div className="space-y-4">
                                    <h2 className="text-4xl font-black tracking-tighter text-foreground leading-tight">타협하지 않는 <br /> 최고 수준의 보안 아키텍처</h2>
                                    <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                                        NiceTop의 모든 데이터는 AES-256 규격으로 암호화되어 안전하게 보호됩니다.
                                        우리는 고객사의 소중한 문항 데이터와 응시자의 개인정보를
                                        엔터프라이즈 보안 표준에 따라 물리적으로 격리하여 관리합니다.
                                    </p>
                                </div>

                                <div className="grid gap-6">
                                    <TechFeature
                                        icon={Lock}
                                        title="End-to-End Encryption"
                                        description="영상 스트리밍부터 결과 리포트까지 모든 데이터 전송 구간에 최고 단계 암호화를 적용합니다."
                                    />
                                    <TechFeature
                                        icon={Cpu}
                                        title="AI Vision Intelligence"
                                        description="서버 부하 없이 클라이언트 사이드에서 실시간으로 구동되는 가벼운 AI 시연 모델을 탑재하고 있습니다."
                                    />
                                    <TechFeature
                                        icon={CheckCircle2}
                                        title="Compliance Ready"
                                        description="글로벌 개인정보 보호 가이드라인(GDPR 등)을 준수하며 정기적인 보안 감사를 시행합니다."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA 섹션 */}
                <section className="py-32 bg-primary text-primary-foreground text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
                    <div className="container mx-auto px-6 max-w-4xl relative z-10 space-y-12 animate-in">
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.1]">
                            귀사의 채용 프로세스를 <br />
                            프로페셔널하게 업그레이드 하세요
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Link href="/">
                                <Button size="lg" variant="secondary" className="h-16 px-12 rounded-2xl font-black text-xl shadow-2xl transition-all hover:scale-[1.05] active:scale-95">
                                    플랫폼 바로 체험하기
                                </Button>
                            </Link>
                            <Button size="lg" variant="outline" className="h-16 px-12 rounded-2xl font-bold text-lg bg-white/5 border-white/20 text-white hover:bg-white/10 transition-all">
                                맞춤형 도입 문의
                            </Button>
                        </div>
                        <p className="text-xs font-black opacity-40 uppercase tracking-[0.4em] italic">Authorized Personnel Only // Security Sync v2.0</p>
                    </div>
                </section>
            </main>

            {/* 푸터 */}
            <footer className="bg-background border-t border-border py-16">
                <div className="container mx-auto px-6 max-w-7xl flex flex-col md:flex-row justify-between items-center gap-10 text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-primary" />
                        <span className="text-sm font-black tracking-widest uppercase text-foreground">NiceTop Enterprise Solution</span>
                    </div>
                    <p className="text-xs font-bold opacity-60">© 2026 NiceTop Global. Optimized for next-generation talent acquisition.</p>
                </div>
            </footer>
        </div>
    )
}

function BadgeSection({ text }: { text: string }) {
    return (
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest ring-1 ring-primary/5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {text}
        </div>
    )
}

function ValueCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <Card className="p-10 border-border bg-card/50 backdrop-blur-md ring-1 ring-border/50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-none group">
            <div className="w-16 h-16 bg-muted rounded-3xl flex items-center justify-center mb-8 border border-border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                <Icon className="w-8 h-8" />
            </div>
            <h4 className="text-2xl font-black mb-4 text-foreground tracking-tight">{title}</h4>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed opacity-80">{description}</p>
        </Card>
    )
}

function TechFeature({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="flex gap-6 group">
            <div className="p-3.5 bg-muted rounded-2xl border border-border group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/30 transition-all duration-300 shrink-0 self-start">
                <Icon className="w-5 h-5 opacity-70" />
            </div>
            <div className="space-y-1.5">
                <h5 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">{title}</h5>
                <p className="text-sm text-muted-foreground font-medium italic opacity-70 leading-relaxed">{description}</p>
            </div>
        </div>
    )
}
