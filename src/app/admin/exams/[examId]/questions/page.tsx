'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
    ArrowLeft,
    Plus,
    Loader2,
    Trash2,
    FileText,
    Check,
    Edit2,
    BrainCircuit,
    Layers,
    CheckCircle2,
    AlertCircle
} from 'lucide-react'

export default function ExamQuestionsPage() {
    const router = useRouter()
    const params = useParams()
    const examId = params?.examId as string

    const [loading, setLoading] = useState(true)
    const [questions, setQuestions] = useState<any[]>([])
    const [exam, setExam] = useState<any>(null)
    const [open, setOpen] = useState(false)

    // 문항 편집/추가 공통 상태
    const [editingId, setEditingId] = useState<string | null>(null)
    const [newQ, setNewQ] = useState<any>({
        type: 'MULTIPLE_CHOICE',
        content: '',
        points: 10,
        difficulty: 1,
        options: [
            { id: '1', content: '', isCorrect: false },
            { id: '2', content: '', isCorrect: false },
            { id: '3', content: '', isCorrect: false },
            { id: '4', content: '', isCorrect: false },
        ]
    })

    const fetchData = async () => {
        try {
            const examRes = await fetch(`/api/exams/${examId}`)
            const examData = await examRes.json()
            if (examData.success) setExam(examData.exam)

            const qRes = await fetch(`/api/exams/${examId}/questions`)
            const qData = await qRes.json()
            if (qData.success) setQuestions(qData.questions)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (examId) fetchData()
    }, [examId])

    const handleOpenAdd = () => {
        setEditingId(null)
        setNewQ({
            type: 'MULTIPLE_CHOICE',
            content: '',
            points: 10,
            difficulty: 1,
            options: [
                { id: '1', content: '', isCorrect: false },
                { id: '2', content: '', isCorrect: false },
                { id: '3', content: '', isCorrect: false },
                { id: '4', content: '', isCorrect: false },
            ]
        })
        setOpen(true)
    }

    const handleOpenEdit = (eq: any) => {
        setEditingId(eq.question.id)
        setNewQ({
            type: eq.question.type,
            content: eq.question.content,
            points: eq.question.points,
            difficulty: eq.question.difficulty,
            options: eq.question.options || []
        })
        setOpen(true)
    }

    const handleSaveQuestion = async () => {
        const method = editingId ? 'PUT' : 'POST'
        const url = editingId
            ? `/api/exams/${examId}/questions/${editingId}`
            : `/api/exams/${examId}/questions`

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newQ),
            })
            const data = await res.json()
            if (data.success) {
                toast.success(editingId ? '문항이 수정되었습니다.' : '문항이 추가되었습니다.')
                setOpen(false)
                fetchData()
            }
        } catch (error) {
            toast.error('저장 실패')
        }
    }

    const toggleOptionCorrect = (index: number) => {
        const updated = [...newQ.options]
        if (newQ.type === 'MULTIPLE_CHOICE') {
            updated.forEach((opt, i) => opt.isCorrect = i === index)
        } else {
            updated[index].isCorrect = !updated[index].isCorrect
        }
        setNewQ({ ...newQ, options: updated })
    }

    const updateOptionContent = (index: number, content: string) => {
        const updated = [...newQ.options]
        updated[index].content = content
        setNewQ({ ...newQ, options: updated })
    }

    const addOption = () => {
        setNewQ({
            ...newQ,
            options: [...newQ.options, { id: Math.random().toString(), content: '', isCorrect: false }]
        })
    }

    const removeOption = (index: number) => {
        setNewQ({
            ...newQ,
            options: newQ.options.filter((_: any, i: number) => i !== index)
        })
    }

    const handleDeleteQuestion = async (qId: string) => {
        if (!confirm('이 문항을 시험에서 제거하시겠습니까?')) return
        try {
            const res = await fetch(`/api/exams/${examId}/questions/${qId}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                toast.success('문항이 제거되었습니다.')
                fetchData()
            }
        } catch (error) {
            toast.error('제거 실패')
        }
    }

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    )

    return (
        <div className="container mx-auto py-12 px-6 max-w-5xl space-y-10 selection:bg-primary/10 text-foreground">
            {/* 헤더 섹션 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in">
                <div className="flex items-center gap-6">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-12 w-12 rounded-2xl bg-card border border-border hover:bg-muted transition-all shadow-sm">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-foreground">문항 관리 포털</h1>
                        <p className="text-lg text-muted-foreground mt-1 font-medium italic opacity-70">
                            <span className="font-black text-primary not-italic">{exam?.title}</span> 프로젝트의 평가 항목을 정밀하게 설계합니다.
                        </p>
                    </div>
                </div>

                <Button
                    onClick={handleOpenAdd}
                    className="h-12 px-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all font-black active:scale-95"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    신규 문항 설계
                </Button>
            </div>

            {/* 문항 리스트 */}
            <div className="space-y-8">
                {questions.length === 0 ? (
                    <Card className="border-border border-dashed border bg-transparent animate-in">
                        <CardContent className="py-24 text-center">
                            <div className="bg-primary/10 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8 ring-1 ring-primary/20 transition-all hover:translate-y-[-2px]">
                                <BrainCircuit className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight mb-2">등록된 문항이 없습니다.</h3>
                            <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">평가 목적에 맞는 최적의 문항을 하나씩 구성하여 업계 최고의 변별력을 확보하십시오.</p>
                            <Button variant="outline" className="mt-8 font-bold rounded-xl h-12 px-8" onClick={handleOpenAdd}>
                                첫 문항 작성하기
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        {questions.map((eq, idx) => (
                            <Card key={eq.id} className="glass transition-all hover:translate-y-[-1px] animate-in" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="bg-muted/30 px-8 py-5 border-b border-border flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground font-black flex items-center justify-center shadow-lg shadow-primary/20 text-lg tabular-nums">
                                            {idx + 1}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-md">
                                                    {eq.question.type === 'MULTIPLE_CHOICE' ? '객관식 (단일)' :
                                                        eq.question.type === 'MULTIPLE_SELECT' ? '객관식 (다중)' :
                                                            eq.question.type === 'SHORT_ANSWER' ? '주관식 (단답)' :
                                                                eq.question.type === 'ESSAY' ? '서술형' : '비디오 답변'}
                                                </Badge>
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-50 tabular-nums">{eq.question.points} POINTS</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                            onClick={() => handleOpenEdit(eq)}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-destructive hover:text-white hover:bg-destructive/80 rounded-lg transition-all"
                                            onClick={() => handleDeleteQuestion(eq.question.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <CardContent className="p-8 space-y-6">
                                    <div className="text-xl font-bold leading-relaxed text-foreground/90">
                                        {eq.question.content}
                                    </div>

                                    {(eq.question.type.includes('MULTIPLE')) && Array.isArray(eq.question.options) && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                                            {eq.question.options.map((opt: any, oIdx: number) => (
                                                <div key={opt.id} className={`p-4 rounded-2xl border transition-all flex items-center gap-4 ${opt.isCorrect ? 'bg-emerald-500/5 border-emerald-500/30 ring-1 ring-emerald-500/20' : 'bg-muted/20 border-border/50'}`}>
                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black tabular-nums shrink-0 ${opt.isCorrect ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-muted-foreground/10 text-muted-foreground'}`}>
                                                        {oIdx + 1}
                                                    </div>
                                                    <span className={`text-sm font-bold truncate flex-1 ${opt.isCorrect ? 'text-emerald-600' : 'text-muted-foreground'}`}>{opt.content}</span>
                                                    {opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* 문항 생성/수정 다이얼로그 */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[760px] bg-card border-border shadow-2xl p-0 rounded-[2.5rem] overflow-hidden">
                    <div className="bg-muted/30 p-10 border-b border-border">
                        <DialogHeader>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                                    <Edit2 className="w-5 h-5 text-primary" />
                                </div>
                                <DialogTitle className="text-3xl font-black tracking-tighter">{editingId ? '문항 사양 수정' : '신규 문항 프로토콜 설계'}</DialogTitle>
                            </div>
                            <DialogDescription className="text-muted-foreground font-medium text-base">
                                평가 엔진이 해석할 수 있도록 상세 설정을 정의하십시오.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh]">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">문항 엔진 유형</Label>
                                <Select value={newQ.type} onValueChange={(v) => setNewQ({ ...newQ, type: v })}>
                                    <SelectTrigger className="bg-muted/30 border-border h-12 font-bold focus:ring-primary/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border shadow-2xl">
                                        <SelectItem value="MULTIPLE_CHOICE">객관식 [단일 선택 모드]</SelectItem>
                                        <SelectItem value="MULTIPLE_SELECT">객관식 [다중 선택 모드]</SelectItem>
                                        <SelectItem value="SHORT_ANSWER">주관식 [단답형 알고리즘]</SelectItem>
                                        <SelectItem value="ESSAY">주관식 [심층 서술 모드]</SelectItem>
                                        <SelectItem value="SPEAKING">비디오 인터뷰 [Recording Active]</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">할당 배점</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={newQ.points}
                                        onChange={(e) => setNewQ({ ...newQ, points: parseInt(e.target.value) || 10 })}
                                        className="bg-muted/30 border-border h-12 font-black text-xl pl-6 focus:ring-primary/20"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground opacity-30">PTS</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">질문 텍스트 데이터</Label>
                            <Textarea
                                placeholder="응시자에게 전달할 질문의 핵심 내용을 구조화된 문장으로 입력하십시오."
                                value={newQ.content}
                                onChange={(e) => setNewQ({ ...newQ, content: e.target.value })}
                                className="min-h-[160px] bg-muted/30 border-border leading-relaxed font-bold text-lg p-6 focus:ring-primary/20"
                            />
                        </div>

                        {(newQ.type.includes('MULTIPLE')) && (
                            <div className="space-y-4 pt-4 border-t border-border">
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">옵션 데이터 필드</Label>
                                    <Button variant="secondary" size="sm" onClick={addOption} className="h-8 rounded-lg font-black text-[10px] tracking-widest uppercase">
                                        <Plus className="w-3 h-3 mr-1" />
                                        필드 추가
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {newQ.options.map((opt: any, idx: number) => (
                                        <div key={opt.id} className="flex items-center gap-4 animate-in">
                                            <button
                                                onClick={() => toggleOptionCorrect(idx)}
                                                className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all shrink-0 font-black tabular-nums shadow-sm ${opt.isCorrect ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-muted border-border text-muted-foreground hover:border-primary/50'}`}
                                            >
                                                {opt.isCorrect ? <Check className="w-6 h-6 stroke-[4]" /> : idx + 1}
                                            </button>
                                            <Input
                                                placeholder={`항목 ${idx + 1}의 답변 텍스트를 입력하십시오.`}
                                                value={opt.content}
                                                onChange={(e) => updateOptionContent(idx, e.target.value)}
                                                className="bg-card border-border h-12 font-bold focus:ring-primary/20"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeOption(idx)}
                                                className="h-10 w-10 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 shrink-0 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 p-10 bg-muted/30 border-t border-border">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="h-12 px-8 font-bold text-muted-foreground">프로세스 중단</Button>
                        <Button
                            onClick={handleSaveQuestion}
                            disabled={!newQ.content.trim()}
                            className="px-12 h-12 rounded-xl font-black text-lg bg-primary text-primary-foreground shadow-2xl shadow-primary/20 transition-all active:scale-95"
                        >
                            {editingId ? '사양 업데이트' : '설계 완료 및 배포'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
