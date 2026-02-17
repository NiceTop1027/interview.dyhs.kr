// 환경 변수 검증 및 접근 유틸리티

// 필수 환경 변수 검증
function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`필수 환경 변수 ${key}가 설정되지 않았습니다.`)
  }
  return value
}

// 선택적 환경 변수 (기본값 있음)
function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue
}

// 환경 변수 설정 객체
export const env = {
  // JWT 설정 - 프로덕션에서는 반드시 설정 필요
  get JWT_SECRET(): string {
    if (process.env.NODE_ENV === 'production') {
      return getRequiredEnv('JWT_SECRET')
    }
    // 개발 환경에서만 기본값 허용
    return getOptionalEnv('JWT_SECRET', 'dev-secret-key-change-in-production')
  },

  // 데이터베이스 URL
  get DATABASE_URL(): string {
    return getRequiredEnv('DATABASE_URL')
  },

  // LiveKit 설정
  get LIVEKIT_API_KEY(): string | undefined {
    return process.env.LIVEKIT_API_KEY
  },

  get LIVEKIT_API_SECRET(): string | undefined {
    return process.env.LIVEKIT_API_SECRET
  },

  get LIVEKIT_URL(): string | undefined {
    return process.env.NEXT_PUBLIC_LIVEKIT_URL
  },

  // 사이트 URL
  get SITE_URL(): string | undefined {
    return process.env.NEXT_PUBLIC_SITE_URL
  },

  // 환경
  get NODE_ENV(): string {
    return process.env.NODE_ENV || 'development'
  },

  get isDevelopment(): boolean {
    return this.NODE_ENV === 'development'
  },

  get isProduction(): boolean {
    return this.NODE_ENV === 'production'
  },
}

// 파일 업로드 설정
export const uploadConfig = {
  // 허용된 녹화 파일 MIME 타입
  allowedRecordingTypes: [
    'video/webm',
    'video/mp4',
    'video/ogg',
    'audio/webm',
    'audio/mp4',
    'audio/ogg',
  ],

  // 최대 파일 크기 (100MB)
  maxFileSize: 100 * 1024 * 1024,

  // 허용된 확장자
  allowedExtensions: ['webm', 'mp4', 'ogg', 'wav', 'mp3'],
}
