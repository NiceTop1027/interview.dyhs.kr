'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Video, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface VideoUploadProps {
  sessionId: string
  userId: string
  onUploadComplete?: (recordingId: string, fileName: string) => void
  onAnalysisComplete?: (analysisResult: any) => void
}

export function VideoUploadComponent({ sessionId, userId, onUploadComplete, onAnalysisComplete }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 파일 형식 검증
    const allowedTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/mov']
    if (!allowedTypes.includes(file.type)) {
      setError('지원되지 않는 비디오 형식입니다. (MP4, WebM, AVI, MOV)')
      return
    }

    // 파일 크기 검증 (500MB 제한)
    const maxSize = 500 * 1024 * 1024
    if (file.size > maxSize) {
      setError('파일 크기가 500MB를 초과할 수 없습니다.')
      return
    }

    await uploadVideo(file)
  }

  const uploadVideo = async (file: File) => {
    setUploading(true)
    setError('')
    setSuccess('')
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('video', file)
      formData.append('sessionId', sessionId)
      formData.append('userId', userId)

      // 업로드 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/video-analysis/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (result.success) {
        setSuccess('비디오 업로드가 성공적으로 완료되었습니다.')
        onUploadComplete?.(result.recordingId, result.fileName)
        
        // 업로드 후 자동 분석 시작
        setTimeout(() => {
          analyzeVideo(result.filePath)
        }, 1000)
      } else {
        setError(result.error || '업로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError('업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const analyzeVideo = async (recordingUrl: string) => {
    setAnalyzing(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/video-analysis/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          recordingUrl
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccess('비디오 분석이 완료되었습니다.')
        onAnalysisComplete?.(result.analysisResult)
      } else {
        setError(result.error || '분석에 실패했습니다.')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      setError('분석 중 오류가 발생했습니다.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      uploadVideo(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          비디오 분석 업로드
        </CardTitle>
        <CardDescription>
          녹화된 면접 영상을 업로드하면 AI가 자동으로 태도와 발언 내용을 분석합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 파일 드래그 앤 드롭 영역 */}
        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading || analyzing}
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium">비디오 파일을 선택하거나 드래그하세요</p>
              <p className="text-sm text-muted-foreground mt-1">
                MP4, WebM, AVI, MOV (최대 500MB)
              </p>
            </div>
          </div>
        </div>

        {/* 업로드 진행률 */}
        {(uploading || analyzing) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                {uploading ? '업로드 중...' : '분석 중...'}
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* 로딩 상태 */}
        {(uploading || analyzing) && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              {uploading ? '비디오를 업로드하는 중입니다...' : 'AI가 비디오를 분석하는 중입니다...'}
            </span>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 성공 메시지 */}
        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle2 className="w-4 h-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* 안내 메시지 */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• 분석에는 영상 길이에 따라 몇 분이 소요될 수 있습니다.</p>
          <p>• AI는 얼굴 표정, 시선, 음성, 말하는 내용을 종합적으로 분석합니다.</p>
          <p>• 분석 결과는 자동으로 저장되며 관리자에서 확인할 수 있습니다.</p>
        </div>
      </CardContent>
    </Card>
  )
}
