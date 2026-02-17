'use client'

import { useState } from 'react'
import { VideoUploadComponent } from '@/components/video-analysis/VideoUploadComponent'
import { AnalysisResults } from '@/components/video-analysis/AnalysisResults'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Brain, Upload, Search, AlertCircle } from 'lucide-react'

export default function VideoAnalysisPage() {
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [candidateName, setCandidateName] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [searchResult, setSearchResult] = useState<any>(null)
  const [searchError, setSearchError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUploadComplete = (recordingId: string, fileName: string) => {
    console.log('Upload completed:', { recordingId, fileName })
  }

  const handleAnalysisComplete = (result: any) => {
    setAnalysisResult(result)
  }

  const handleSearchAnalysis = async () => {
    if (!sessionId.trim()) {
      setSearchError('세션 ID를 입력해주세요.')
      return
    }

    setLoading(true)
    setSearchError('')

    try {
      const response = await fetch(`/api/video-analysis/analyze?sessionId=${sessionId.trim()}`)
      const result = await response.json()

      if (result.success) {
        setSearchResult(result)
        setAnalysisResult(result.analysisResult)
        setCandidateName(result.candidateName)
      } else {
        setSearchError(result.error || '분석 결과를 찾을 수 없습니다.')
        setSearchResult(null)
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchError('조회 중 오류가 발생했습니다.')
      setSearchResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="space-y-8">
        {/* 페이지 헤더 */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">AI 비디오 분석 시스템</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            녹화된 면접 영상을 AI가 자동으로 분석하여 응시자의 태도, 표정, 음성, 발언 내용 등을 종합적으로 평가합니다.
          </p>
        </div>

        {/* 기능 탭 */}
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              새 영상 분석
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              분석 결과 조회
            </TabsTrigger>
          </TabsList>

          {/* 새 영상 분석 탭 */}
          <TabsContent value="upload" className="space-y-6">
            <VideoUploadComponent
              sessionId={sessionId || 'temp-session'}
              userId="temp-user"
              onUploadComplete={handleUploadComplete}
              onAnalysisComplete={handleAnalysisComplete}
            />

            {/* 분석 결과 표시 */}
            {analysisResult && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">분석 결과</h2>
                <AnalysisResults 
                  analysisResult={analysisResult} 
                  candidateName={candidateName}
                />
              </div>
            )}
          </TabsContent>

          {/* 분석 결과 조회 탭 */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  분석 결과 조회
                </CardTitle>
                <CardDescription>
                  세션 ID를 입력하여 저장된 분석 결과를 조회합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionId">세션 ID</Label>
                  <Input
                    id="sessionId"
                    placeholder="세션 ID를 입력하세요"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    className="font-mono"
                  />
                </div>
                
                <Button 
                  onClick={handleSearchAnalysis}
                  disabled={loading || !sessionId.trim()}
                  className="w-full"
                >
                  {loading ? '조회 중...' : '분석 결과 조회'}
                </Button>

                {searchError && (
                  <Alert variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{searchError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* 조회된 분석 결과 표시 */}
            {searchResult && analysisResult && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">조회된 분석 결과</h2>
                  <div className="text-sm text-muted-foreground">
                    세션 ID: <span className="font-mono">{sessionId}</span>
                  </div>
                </div>
                <AnalysisResults 
                  analysisResult={analysisResult} 
                  candidateName={candidateName}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* 안내 정보 */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">분석 기능 안내</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">얼굴 표정 분석</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• 행복, 슬픔, 분노, 놀람 등 7가지 표정 인식</li>
                  <li>• 시선 방향 및 집중도 측정</li>
                  <li>• 자신감 수준 평가</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">음성 및 발언 분석</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• 음성을 텍스트로 변환 (STT)</li>
                  <li>• 핵심 키워드 및 감성 분석</li>
                  <li>• 말하기 속도 및 명확성 평가</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">행동 패턴 분석</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• 자세 및 제스처 분석</li>
                  <li>• 참여도 및 몰입도 측정</li>
                  <li>• 긍정/부정적 행동 패턴 식별</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">종합 평가</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• 모든 분석 결과 통합 점수화</li>
                  <li>• 강점 및 개선점 제안</li>
                  <li>• 객관적인 평가 리포트 제공</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
