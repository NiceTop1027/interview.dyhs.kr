'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { FaceDetector } from '@mediapipe/tasks-vision'

interface FaceDetectionResult {
  faceCount: number
  isFaceVisible: boolean
  gazeDirection: 'center' | 'left' | 'right' | 'up' | 'down'
  confidence: number
  faceSize: { width: number; height: number } // 얼굴 크기 정보 추가
  facePosition: { x: number; y: number } // 얼굴 위치 정보 추가
}

interface UseFaceDetectionOptions {
  enabled: boolean
  onResult?: (result: FaceDetectionResult) => void
  onStreamReady?: (stream: MediaStream) => void
  detectionInterval?: number
}

export function useFaceDetection({
  enabled,
  onResult,
  onStreamReady,
  detectionInterval = 500,
}: UseFaceDetectionOptions) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<FaceDetectionResult>({
    faceCount: 0,
    isFaceVisible: false,
    gazeDirection: 'center',
    confidence: 0,
    faceSize: { width: 0, height: 0 },
    facePosition: { x: 0, y: 0 },
  })

  const faceDetectorRef = useRef<FaceDetector | null>(null)
  const faceLandmarkerRef = useRef<any | null>(null)
  const landmarkerInitAttemptedRef = useRef(false)
  const detectInFlightRef = useRef(false)
  const animationRef = useRef<number | null>(null)
  const lastDetectionRef = useRef<number>(0)
  const smoothCoords = useRef({ x: 0.5, y: 0.5 })

  const onResultRef = useRef(onResult)
  const onStreamReadyRef = useRef(onStreamReady)

  useEffect(() => { onResultRef.current = onResult }, [onResult])
  useEffect(() => { onStreamReadyRef.current = onStreamReady }, [onStreamReady])

  const initializeFaceLandmarker = useCallback(async () => {
    if (faceLandmarkerRef.current || landmarkerInitAttemptedRef.current) return
    landmarkerInitAttemptedRef.current = true

    try {
      const vision = await import('@mediapipe/tasks-vision')
      const { FaceLandmarker, FilesetResolver } = vision as any

      if (!FaceLandmarker || !FilesetResolver) {
        return
      }

      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )

      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          // FaceLandmarker 모델 (FaceMesh)
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 2,
        minFaceDetectionConfidence: 0.6,
        minFacePresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
      })
    } catch (err) {
      console.warn('FaceLandmarker init failed, fallback to FaceDetector:', err)
    }
  }, [])

  // MediaPipe Face Detection 초기화
  const initializeFaceDetection = useCallback(async () => {
    if (faceDetectorRef.current) return
    try {
      const vision = await import('@mediapipe/tasks-vision')
      const { FaceDetector, FilesetResolver } = vision
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )
      faceDetectorRef.current = await FaceDetector.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.6, // 신뢰도 임계값 증가
        minSuppressionThreshold: 0.3, // 중복 감지 방지
      })
    } catch (err) {
      console.error('Face detection init error:', err)
      setError('얼굴 감지 초기화 실패')
    }
  }, [])

  const estimateGazeFromNormalizedPosition = useCallback((x: number, y: number) => {
    // 기본 임계값: 화면 중앙(0.5,0.5) 기준
    if (x < 0.35) return 'left'
    if (x > 0.65) return 'right'
    if (y < 0.35) return 'up'
    if (y > 0.65) return 'down'
    return 'center'
  }, [])

  // 얼굴 감지 실행 루프
  const detectFaces = useCallback(() => {
    if (!videoRef.current || !enabled) return

    const now = performance.now()
    if (now - lastDetectionRef.current >= detectionInterval) {
      lastDetectionRef.current = now

      // async detector가 겹쳐 실행되는 것 방지
      if (!detectInFlightRef.current) {
        detectInFlightRef.current = true
        void (async () => {
          try {
            const video = videoRef.current
            if (!video || video.readyState !== 4) return

            // 1) MediaPipe FaceLandmarker(FaceMesh) 우선
            if (faceLandmarkerRef.current) {
              const landmarkerResult = await faceLandmarkerRef.current.detectForVideo(video, now)
              const faceLandmarks = landmarkerResult?.faceLandmarks || []
              const faceCount = Array.isArray(faceLandmarks) ? faceLandmarks.length : 0
              const isFaceVisible = faceCount > 0

              let gazeDirection: FaceDetectionResult['gazeDirection'] = 'center'
              let confidence = isFaceVisible ? 0.9 : 0
              let faceSize = { width: 0, height: 0 }
              let facePosition = { x: 0.5, y: 0.5 }

              if (isFaceVisible && faceLandmarks[0] && Array.isArray(faceLandmarks[0])) {
                const pts = faceLandmarks[0] as Array<{ x: number; y: number }>
                let minX = 1
                let minY = 1
                let maxX = 0
                let maxY = 0
                for (const p of pts) {
                  minX = Math.min(minX, p.x)
                  minY = Math.min(minY, p.y)
                  maxX = Math.max(maxX, p.x)
                  maxY = Math.max(maxY, p.y)
                }

                faceSize = { width: maxX - minX, height: maxY - minY }
                facePosition = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }

                const alpha = 0.25
                smoothCoords.current.x = smoothCoords.current.x * (1 - alpha) + facePosition.x * alpha
                smoothCoords.current.y = smoothCoords.current.y * (1 - alpha) + facePosition.y * alpha
                gazeDirection = estimateGazeFromNormalizedPosition(
                  smoothCoords.current.x,
                  smoothCoords.current.y
                ) as FaceDetectionResult['gazeDirection']
              }

              const newResult: FaceDetectionResult = {
                faceCount,
                isFaceVisible,
                gazeDirection,
                confidence,
                faceSize,
                facePosition,
              }
              setResult(newResult)
              onResultRef.current?.(newResult)
              return
            }

            // 2) MediaPipe FaceDetector fallback
            if (!faceDetectorRef.current) return
            const detections = faceDetectorRef.current.detectForVideo(video, now)
            const faceCount = detections.detections?.length || 0
            const isFaceVisible = faceCount > 0
            let gazeDirection: FaceDetectionResult['gazeDirection'] = 'center'
            let confidence = 0

            let faceSize = { width: 0, height: 0 }
            let facePosition = { x: 0.5, y: 0.5 }

            if (faceCount > 0 && detections.detections[0]) {
              const detection = detections.detections[0]
              confidence = detection.categories?.[0]?.score || 0
              const boundingBox = detection.boundingBox
              if (boundingBox) {
                faceSize = {
                  width: boundingBox.width || 0,
                  height: boundingBox.height || 0,
                }
                facePosition = {
                  x: (boundingBox as any).centerX || 0.5,
                  y: (boundingBox as any).centerY || 0.5,
                }
              }

              const alpha = 0.3
              smoothCoords.current.x = smoothCoords.current.x * (1 - alpha) + facePosition.x * alpha
              smoothCoords.current.y = smoothCoords.current.y * (1 - alpha) + facePosition.y * alpha
              gazeDirection = estimateGazeFromNormalizedPosition(smoothCoords.current.x, smoothCoords.current.y) as FaceDetectionResult['gazeDirection']
            }

            const newResult: FaceDetectionResult = {
              faceCount,
              isFaceVisible,
              gazeDirection,
              confidence,
              faceSize,
              facePosition,
            }
            setResult(newResult)
            onResultRef.current?.(newResult)
          } catch (err) {
            console.error('Face detection error:', err)
          } finally {
            detectInFlightRef.current = false
          }
        })()
      }
    }

    animationRef.current = requestAnimationFrame(detectFaces)
  }, [enabled, detectionInterval, estimateGazeFromNormalizedPosition])

  // 카메라 스트림 시작
  const startCamera = useCallback(async () => {
    if (!videoRef.current) return
    // 이미 같은 스트림이 있으면 스킵 (깜박임 방지)
    if (videoRef.current.srcObject) return

    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        onStreamReadyRef.current?.(stream)
      }
      setIsLoading(false)
    } catch (err) {
      console.error('Camera access error:', err)
      setError('카메라 접근 실패')
      setIsLoading(false)
    }
  }, [])

  // 중지
  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
  }, [])

  // 라이프사이클 관리
  useEffect(() => {
    let active = true
    if (enabled) {
      setIsLoading(true)
      const run = async () => {
        await startCamera()
        if (!active) return
        await initializeFaceLandmarker()
        if (!active) return
        await initializeFaceDetection()
        if (!active) return
        detectFaces()
      }
      run()
    } else {
      stopCamera()
    }
    return () => {
      active = false
      stopCamera()
    }
  }, [enabled, startCamera, initializeFaceLandmarker, initializeFaceDetection, detectFaces, stopCamera])

  return { videoRef, canvasRef, result, isLoading, error, startCamera, stopCamera }
}
