'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Save, Loader2, Palette, Shield, Building2, Layout, Brush, Sparkles, Monitor, Database } from 'lucide-react'

export default function AdminSettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState({
        platformName: 'DY-INTERVIEW',
        enterpriseName: 'DY-INTERVIEW Enterprise',
        primaryColor: 'slate-900',
        designMode: 'CORPORATE',
    })

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings')
            const data = await res.json()
            if (data.success) {
                setSettings(data.settings)
            }
        } catch (error) {
            console.error('Fetch settings error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = (field: string, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success('시스템 설정이 성공적으로 업데이트되었습니다.')
                router.refresh()
            } else {
                toast.error(data.error || '설정 저장에 실패했습니다.')
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

    return (
        <div className="min-h-screen bg-background text-foreground pb-20 selection:bg-primary/10">
            {/* 고정 상단 헤더 */}
            <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-6 py-5 flex items-center justify-between max-w-6xl">
                    <div className="flex items-center gap-6">
                        <Button variant="ghost" size="icon" asChild className="h-12 w-12 rounded-[1rem] bg-card border border-border shadow-sm hover:shadow-md transition-all">
                            <Link href="/admin">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">DY-INTERVIEW 설정</h1>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-50 mt-0.5">Enterprise Infrastructure Control</p>
                        </div>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-xl h-12 px-8 font-black text-sm shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px] active:translate-y-px bg-primary text-primary-foreground"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        변경 사양 배포
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-12 max-w-6xl">
                <div className="grid md:grid-cols-12 gap-10">
                    {/* 좌측 사이드 네비게이션 */}
                    <div className="md:col-span-3 space-y-4">
                        <div className="p-1.5 bg-muted/30 rounded-2xl border border-border/50">
                            <NavButton icon={Building2} label="브랜딩 전술" active />
                            <NavButton icon={Palette} label="테마 엔지니어링" />
                            <NavButton icon={Shield} label="거버넌스 & 보안" />
                            <NavButton icon={Database} label="데이터 인프라" />
                        </div>

                        <Card className="p-5 bg-primary/5 border-primary/10 rounded-2xl">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">System Core v4.2</span>
                            </div>
                            <p className="text-[11px] font-bold text-muted-foreground leading-relaxed">모든 구성 변경 사항은 즉각적으로 오케스트레이션 엔진을 통해 배포됩니다.</p>
                        </Card>
                    </div>

                    {/* 메인 설정 레이아웃 */}
                    <div className="md:col-span-9 space-y-10 animate-in">
                        {/* 플랫폼 브랜딩 엔진 */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-1.5 h-6 bg-primary rounded-full shadow-lg shadow-primary/40" />
                                <h2 className="text-xl font-black tracking-tight uppercase">Platform Identity Specification</h2>
                            </div>

                            <Card className="glass transition-all duration-500">
                                <CardContent className="p-10 space-y-10">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label htmlFor="platformName" className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">System Logical ID</Label>
                                            <div className="relative">
                                                <Input
                                                    id="platformName"
                                                    value={settings.platformName}
                                                    onChange={(e) => handleUpdate('platformName', e.target.value)}
                                                    className="h-14 font-black text-xl bg-muted/30 border-border focus:ring-primary/20 px-6 rounded-2xl"
                                                />
                                                <Building2 className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" />
                                            </div>
                                            <p className="text-[10px] font-bold text-muted-foreground italic px-2">GNB 헤더의 대표 텍스트로 사용됩니다.</p>
                                        </div>
                                        <div className="space-y-3">
                                            <Label htmlFor="enterpriseName" className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Primary Display String</Label>
                                            <div className="relative">
                                                <Input
                                                    id="enterpriseName"
                                                    value={settings.enterpriseName}
                                                    onChange={(e) => handleUpdate('enterpriseName', e.target.value)}
                                                    className="h-14 font-bold bg-muted/30 border-border focus:ring-primary/20 px-6 rounded-2xl"
                                                />
                                                <Layout className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" />
                                            </div>
                                            <p className="text-[10px] font-bold text-muted-foreground italic px-2">메인 대시보드 및 시스템 헤더에 노출됩니다.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* 디자인 미학 모듈 */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-1.5 h-6 bg-primary rounded-full shadow-lg shadow-primary/40" />
                                <h2 className="text-xl font-black tracking-tight uppercase">Design Aesthetic Protocol</h2>
                            </div>

                            <Card className="glass">
                                <CardContent className="p-10 space-y-10">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <DesignModeCard
                                            active={settings.designMode === 'CORPORATE'}
                                            onClick={() => handleUpdate('designMode', 'CORPORATE')}
                                            icon={Monitor}
                                            title="Corporate Edge"
                                            description="구조화된 정밀성과 신뢰감을 강조하는 엔터프라이즈 전용 레이아웃"
                                        />
                                        <DesignModeCard
                                            active={settings.designMode === 'MODERN'}
                                            onClick={() => handleUpdate('designMode', 'MODERN')}
                                            icon={Brush}
                                            title="Dynamic AI"
                                            description="혁신적인 유연성과 감각적인 미학을 제공하는 차세대 인터페이스"
                                        />
                                    </div>

                                    <div className="pt-10 border-t border-border/50">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black uppercase tracking-widest">Base Accent Core</h4>
                                                <p className="text-xs text-muted-foreground font-medium italic">브랜드 정체성을 결정짓는 핵심 색상 코드를 정의합니다.</p>
                                            </div>
                                            <Select value={settings.primaryColor} onValueChange={(val) => handleUpdate('primaryColor', val)}>
                                                <SelectTrigger className="w-full md:w-[300px] h-14 bg-muted border-border font-black text-sm rounded-2xl focus:ring-primary/20 px-6">
                                                    <SelectValue placeholder="색상을 선택하십시오" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-border shadow-2xl rounded-2xl overflow-hidden p-2">
                                                    <ColorOption value="slate-900" label="STELTH DARK (DEF)" />
                                                    <ColorOption value="blue-700" label="OCEANIC BLUE" />
                                                    <ColorOption value="emerald-700" label="CRYSTAL EMERALD" />
                                                    <ColorOption value="indigo-700" label="VOLTAIC INDIGO" />
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/30 border-t border-border py-4 px-10 flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] italic">Changes will be broadcasted to all active clusters upon deployment.</p>
                                </CardFooter>
                            </Card>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    )
}

function NavButton({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
    return (
        <Button variant="ghost" className={`w-full justify-start gap-4 h-12 px-5 font-black text-[11px] uppercase tracking-widest transition-all rounded-xl ${active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
            <Icon className="w-4 h-4" />
            {label}
        </Button>
    )
}

function DesignModeCard({ active, onClick, icon: Icon, title, description }: { active: boolean, onClick: () => void, icon: any, title: string, description: string }) {
    return (
        <div
            onClick={onClick}
            className={`p-8 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 group ${active ? 'border-primary bg-primary/[0.03] ring-8 ring-primary/[0.03]' : 'border-border/50 bg-muted/10 hover:bg-muted/30 hover:border-border scale-[0.98]'}`}
        >
            <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-2xl transition-all ${active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground group-hover:scale-110'}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {active && <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />}
            </div>
            <p className="font-black text-lg tracking-tight mb-2">{title}</p>
            <p className="text-xs text-muted-foreground font-bold leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">{description}</p>
        </div>
    )
}

function ColorOption({ value, label }: { value: string, label: string }) {
    return (
        <SelectItem value={value} className="h-11 rounded-xl font-black text-[10px] tracking-widest focus:bg-primary/10 transition-colors">
            {label}
        </SelectItem>
    )
}
