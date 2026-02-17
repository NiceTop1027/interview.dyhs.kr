import { CheatingLogItem } from '@/types'

const createCheatingLogId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export interface DetectionConfig {
  enableFaceDetection: boolean
  enableGazeTracking: boolean
  enableMultipleFaceDetection: boolean
  enableVoiceDetection: boolean
  enableTabSwitchDetection: boolean
  faceNotDetectedThreshold: number // ms
  gazeAwayThreshold: number // ms
}

export const defaultConfig: DetectionConfig = {
  enableFaceDetection: true,
  enableGazeTracking: true,
  enableMultipleFaceDetection: true,
  enableVoiceDetection: true,
  enableTabSwitchDetection: true,
  faceNotDetectedThreshold: 5000, // 5초로 증가 (더 관대한 설정)
  gazeAwayThreshold: 8000, // 8초로 증가 (자연스러운 시선 이동 허용)
}

export class CheatingDetector {
  private config: DetectionConfig
  private onCheatingDetected: (log: CheatingLogItem) => void
  private lastFaceDetectedTime: number = Date.now()
  private lastGazeCenterTime: number = Date.now()
  private isTabVisible: boolean = true

  constructor(
    config: Partial<DetectionConfig> = {},
    onCheatingDetected: (log: CheatingLogItem) => void
  ) {
    this.config = { ...defaultConfig, ...config }
    this.onCheatingDetected = onCheatingDetected
    this.setupTabVisibilityDetection()
    this.setupKeyboardDetection()
  }

  // 탭 전환 감지
  private setupTabVisibilityDetection() {
    if (typeof document === 'undefined') return

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.isTabVisible = false
        this.reportCheating({
          type: 'TAB_SWITCH',
          confidence: 0.9,
          description: '탭 전환 감지됨',
        })
      } else {
        this.isTabVisible = true
      }
    })

    window.addEventListener('blur', () => {
      this.reportCheating({
        type: 'WINDOW_BLUR',
        confidence: 0.7,
        description: '창 포커스 이탈 감지됨',
      })
    })
  }

  // 키보드 단축키 감지
  private setupKeyboardDetection() {
    if (typeof document === 'undefined') return

    document.addEventListener('keydown', (e) => {
      // Print Screen
      if (e.key === 'PrintScreen') {
        e.preventDefault()
        this.reportCheating({
          type: 'SCREENSHOT',
          confidence: 1.0,
          description: '스크린샷 시도 감지됨',
        })
      }

      // Ctrl+C, Ctrl+V (복사/붙여넣기)
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v')) {
        this.reportCheating({
          type: 'COPY_PASTE',
          confidence: 0.8,
          description: `${e.key === 'c' ? '복사' : '붙여넣기'} 시도 감지됨`,
        })
      }

      // F12 (개발자 도구)
      if (e.key === 'F12') {
        e.preventDefault()
        this.reportCheating({
          type: 'BROWSER_DEVTOOLS',
          confidence: 1.0,
          description: '개발자 도구 시도 감지됨',
        })
      }

      // Ctrl+Shift+I (개발자 도구)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault()
        this.reportCheating({
          type: 'BROWSER_DEVTOOLS',
          confidence: 1.0,
          description: '개발자 도구 시도 감지됨',
        })
      }
    })

    // 우클릭 방지
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      this.reportCheating({
        type: 'SUSPICIOUS_BEHAVIOR',
        confidence: 0.5,
        description: '우클릭 시도 감지됨',
      })
    })
  }

  private wasReportingGazeAway: boolean = false
  private wasReportingFaceNotDetected: boolean = false

  // 얼굴 감지 결과 처리
  processFaceDetection(faceCount: number, gazeDirection: string) {
    const now = Date.now()

    // 얼굴 미감지
    if (faceCount === 0) {
      if (
        !this.wasReportingFaceNotDetected &&
        now - this.lastFaceDetectedTime > this.config.faceNotDetectedThreshold
      ) {
        this.wasReportingFaceNotDetected = true
        this.reportCheating({
          type: 'FACE_NOT_DETECTED',
          confidence: 0.8,
          description: '얼굴이 감지되지 않음',
        })
      }
    } else {
      this.lastFaceDetectedTime = now
      this.wasReportingFaceNotDetected = false
    }

    // 다중 인원 감지
    if (faceCount > 1) {
      this.reportCheating({
        type: 'MULTIPLE_FACES',
        confidence: 0.9,
        description: `${faceCount}명의 얼굴이 감지됨`,
      })
    }

    // 시선 이탈 감지
    if (gazeDirection !== 'center') {
      if (
        !this.wasReportingGazeAway &&
        now - this.lastGazeCenterTime > this.config.gazeAwayThreshold
      ) {
        this.wasReportingGazeAway = true
        this.reportCheating({
          type: 'GAZE_AWAY',
          confidence: 0.6,
          description: `시선이 ${gazeDirection} 방향으로 이탈됨`,
        })
      }
    } else {
      this.lastGazeCenterTime = now
      this.wasReportingGazeAway = false
    }
  }

  // 자리 비움 감지
  reportLeftSeat() {
    this.reportCheating({
      type: 'LEFT_SEAT',
      confidence: 0.9,
      description: '자리 비움 감지됨',
    })
  }

  // 대화 감지
  reportVoiceDetected() {
    this.reportCheating({
      type: 'VOICE_DETECTED',
      confidence: 0.7,
      description: '외부 대화 감지됨',
    })
  }

  // 부정행위 보고
  private reportCheating(data: Omit<CheatingLogItem, 'id' | 'timestamp'>) {
    const log: CheatingLogItem = {
      id: createCheatingLogId(),
      ...data,
      timestamp: new Date(),
    }
    this.onCheatingDetected(log)
  }

  // 정리
  destroy() {
    // 이벤트 리스너 정리는 필요시 구현
  }
}

// 다중 모니터 감지
export function detectMultipleMonitors(): boolean {
  if (typeof window === 'undefined') return false

  // Screen API 사용
  const screenWidth = window.screen.width
  const screenAvailWidth = window.screen.availWidth

  // 화면 크기가 비정상적으로 크면 다중 모니터로 의심
  if (screenWidth > 2560 || screenAvailWidth > 2560) {
    return true
  }

  return false
}
