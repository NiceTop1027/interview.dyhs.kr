
// 허용된 origin 목록 가져오기
const getAllowedOrigin = (): string => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    return siteUrl;
  }
  // 개발 환경에서는 localhost 허용
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  // 프로덕션에서 환경 변수가 없으면 빈 문자열 (CORS 비활성화)
  return '';
};

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
      allowedDevOrigins: [
        'http://localhost:23000',
        'http://127.0.0.1:23000',
        'http://10.10.0.100:23000',
      ],
    }
    : {}),
  // 정적 파일 서비스를 위한 설정
  // output: 'standalone',  // Disabled for now due to env issues
  // CORS 설정
  async headers() {
    const isDev = process.env.NODE_ENV === 'development'
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: isDev
              ? 'no-store, max-age=0, must-revalidate'
              : 'public, max-age=31536000, immutable',
          },
          ...(isDev
            ? [
              {
                key: 'Clear-Site-Data',
                value: '"cache", "storage", "executionContexts"',
              },
            ]
            : []),
        ],
      },
      {
        // /_next/static 은 위 규칙에서 별도로 캐싱 처리
        source: '/((?!_next/static).*)',
        headers: [
          {
            // HTML/RSC가 과도하게 캐시되면 오래된 chunk를 참조하여 ChunkLoadError 발생
            key: 'Cache-Control',
            value: 'no-store, max-age=0, must-revalidate',
          },
          {
            // 일부 클라이언트가 이전 chunk(css/js)를 계속 요청하는 경우가 있어 HTTP 캐시를 자동 정리
            // (cookies/localStorage는 유지, cache만 정리)
            key: 'Clear-Site-Data',
            value: isDev ? '"cache", "storage", "executionContexts"' : '"cache"',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

// Force restart
export default nextConfig;
