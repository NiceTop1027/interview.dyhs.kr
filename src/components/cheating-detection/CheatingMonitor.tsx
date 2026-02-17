'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useFaceDetection } from '@/hooks/use-face-detection'
import { CheatingDetector } from '@/lib/cheating-detector'
import { CheatingLogItem } from '@/types'
import { useExamStore } from '@/stores/exam-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Eye, EyeOff, Users, Camera, RefreshCw } from 'lucide-react'

interface CheatingMonitorProps {
  enabled: boolean
  showVideo?: boolean
  onCheatingDetected?: (log: CheatingLogItem) => void
  onStreamReady?: (stream: MediaStream) => void
  onStreamError?: (error: string) => void
}

export function CheatingMonitor({
  enabled,
  showVideo = true,
  onCheatingDetected,
  onStreamReady,
  onStreamError,
}: CheatingMonitorProps) {
  const [warnings, setWarnings] = useState<string[]>([])
  const cheatingDetectorRef = useRef<CheatingDetector | null>(null)
  const addCheatingLog = useExamStore((state) => state.addCheatingLog)

  const handleCheatingDetected = useCallback((log: CheatingLogItem) => {
    addCheatingLog(log)
    onCheatingDetected?.(log)

    // 경고 메시지 추가
    setWarnings((prev) => {
      const newWarnings = [...prev, log.description || log.type]
      // 최근 3개만 유지
      return newWarnings.slice(-3)
    })

    // 5초 후 경고 제거
    setTimeout(() => {
      setWarnings((prev) => prev.slice(1))
    }, 5000)
  }, [addCheatingLog, onCheatingDetected])

  const handleFaceResult = useCallback((faceResult: any) => {
    cheatingDetectorRef.current?.processFaceDetection(
      faceResult.faceCount,
      faceResult.gazeDirection
    )
  }, [])

  const { videoRef, result, isLoading, error, startCamera } = useFaceDetection({
    enabled,
    onResult: handleFaceResult,
    onStreamReady: (stream) => {
      console.log('[CheatingMonitor] Stream is ready from camera')
      onStreamReady?.(stream)
    },
    detectionInterval: 500,
  })

  // 부정행위 감지기 초기화
  useEffect(() => {
    if (enabled) {
      cheatingDetectorRef.current = new CheatingDetector({}, handleCheatingDetected)
    }

    return () => {
      cheatingDetectorRef.current?.destroy()
    }
  }, [enabled, handleCheatingDetected])

  // 에러 핸들러
  useEffect(() => {
    if (error) {
      onStreamError?.(error)
    }
  }, [error, onStreamError])

  if (!enabled) return null

  return (
    <div className="relative">
      {/* 비디오 프리뷰 */}
      {showVideo && (
        <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video group">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
            style={{ transform: 'scaleX(-1)' }}
          />

          {/* 로딩 상태 */}
          {isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 transition-opacity">
              <div className="text-white text-sm flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                카메라 초기화 중...
              </div>
            </div>
          )}

          {/* 상태 배지 */}
          <div className="absolute top-2 left-2 flex gap-2 z-20">
            <Badge variant={result.isFaceVisible ? 'default' : 'destructive'} className="shadow-lg backdrop-blur-md bg-opacity-80">
              {result.isFaceVisible ? (
                <Eye className="w-3 h-3 mr-1" />
              ) : (
                <EyeOff className="w-3 h-3 mr-1" />
              )}
              {result.isFaceVisible ? '얼굴 감지됨' : '얼굴 미감지'}
            </Badge>

            {result.faceCount > 1 && (
              <Badge variant="destructive" className="shadow-lg animate-bounce">
                <Users className="w-3 h-3 mr-1" />
                {result.faceCount}명 감지
              </Badge>
            )}
          </div>

          {/* 시선 방향 표시 */}
          {result.gazeDirection !== 'center' && result.isFaceVisible && (
            <div className="absolute bottom-2 left-2 z-20">
              <Badge variant="secondary" className="shadow-lg backdrop-blur-md bg-opacity-80 border-amber-500/50">
                시선: {result.gazeDirection}
              </Badge>
            </div>
          )}

          {/* 녹화 표시 */}
          <div className="absolute top-2 right-2 z-20">
            <div className="flex items-center gap-1 text-red-500 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold">REC</span>
            </div>
          </div>
        </div>
      )}

      {/* 에러 표시 */}
      {error && (
        <Alert variant="destructive" className="mt-2 border-red-500/50 bg-red-50/50 dark:bg-red-900/20">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => startCamera()}
              className="h-8 px-3 text-xs gap-1 bg-white dark:bg-gray-800"
            >
              <RefreshCw className="w-3 h-3" />
              재시도
            </Button>
          </div>
        </Alert>
      )}

      {/* 경고 메시지 */}
      {warnings.length > 0 && (
        <div className="mt-2 space-y-1">
          {warnings.map((warning, index) => (
            <Alert key={index} variant="destructive" className="py-2">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-sm">{warning}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  )
}
