'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  params: { code: string }
  searchParams?: { name?: string }
}

export default function JoinPage({ params, searchParams }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nameInput, setNameInput] = useState('')

  useEffect(() => {
    let active = true

    const fetchInviteInfo = async () => {
      if (!params.code) return

      try {
        const res = await fetch(`/api/invites/${params.code}`)
        const data = await res.json()

        if (!active) return

        if (data.success && data.invite?.candidateName) {
          setNameInput(data.invite.candidateName)
        }

        // URL query param override (optional, if we want to keep it)
        const nameFromUrl = searchParams?.name
        if (nameFromUrl) {
          try {
            setNameInput(decodeURIComponent(nameFromUrl))
          } catch {
            setNameInput(nameFromUrl)
          }
        }
      } catch (e) {
        // Silent fail for lookup
      }
    }

    fetchInviteInfo()

    return () => {
      active = false
    }
  }, [params.code, searchParams?.name])

  const submit = async (code: string, name: string) => {
    if (!code || !name) return
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name }),
      })

      const data = await res.json()

      if (!res.ok || !data?.success) {
        setError(data?.error || '입장 처리에 실패했습니다.')
        return
      }

      const examId = data.examId
      if (!examId) {
        setError('시험 정보를 찾을 수 없습니다.')
        return
      }

      router.replace(`/exam/${examId}/waiting`)
    } catch (e) {
      setError('입장 처리 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xl">
        <div className="space-y-1">
          <h1 className="text-xl font-bold">면접 입장</h1>
          <p className="text-sm text-muted-foreground">이름이 포함된 전용 URL로 들어오면 자동으로 입장합니다.</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">이름</label>
          <input
            className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="이름을 입력하세요"
            disabled={isSubmitting}
          />
        </div>

        <button
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60"
          onClick={async () => {
            await submit(params.code, nameInput.trim())
          }}
          disabled={isSubmitting || !nameInput.trim()}
        >
          {isSubmitting ? '입장 중...' : '바로 입장'}
        </button>

        {error && (
          <div className="text-sm text-destructive font-medium">{error}</div>
        )}
      </div>
    </div>
  )
}
