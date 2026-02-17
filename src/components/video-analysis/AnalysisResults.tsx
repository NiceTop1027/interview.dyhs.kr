'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Brain, Eye, MessageSquare, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

interface AnalysisResultsProps {
  analysisResult: any
  candidateName?: string
}

export function AnalysisResults({ analysisResult, candidateName }: AnalysisResultsProps) {
  if (!analysisResult) return null

  const { facial, speech, behavior, overall_score, attitude_assessment, recommendations, detailed_insights } = analysisResult

  return (
    <div className="space-y-6">
      {/* 종합 평가 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            종합 평가
          </CardTitle>
          <CardDescription>
            {candidateName && `${candidateName} 님의`} 비디오 분석 결과
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">종합 점수</span>
                <span className="text-lg font-bold">{Math.round(overall_score * 100)}점</span>
              </div>
              <Progress value={overall_score * 100} className="h-3" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(attitude_assessment.positive * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">긍정적</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {Math.round(attitude_assessment.neutral * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">중립적</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {Math.round(attitude_assessment.negative * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">부정적</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 얼굴 표정 분석 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            얼굴 표정 및 시선 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">표정 분석</h4>
              <div className="space-y-2">
                {Object.entries(facial.expressions).map(([emotion, value]) => (
                  <div key={emotion} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{emotion}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(value as number) * 100} className="w-20 h-2" />
                      <span className="text-xs w-10">{Math.round((value as number) * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">시선 및 주의력</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">집중도</span>
                    <span className="text-sm font-medium">{Math.round(facial.attention.focused * 100)}%</span>
                  </div>
                  <Progress value={facial.attention.focused * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">자신감</span>
                    <span className="text-sm font-medium">{Math.round(facial.confidence.high * 100)}%</span>
                  </div>
                  <Progress value={facial.confidence.high * 100} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 음성 분석 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            음성 및 발언 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">발언 내용</h4>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                {speech.transcript}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">핵심 키워드</h4>
                <div className="flex flex-wrap gap-1">
                  {speech.keywords.map((keyword: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">말하기 특징</h4>
                <div className="space-y-1 text-sm">
                  <div>말하는 속도: {speech.speaking_rate} 단어/초</div>
                  <div>멈춤 횟수: {speech.pause_count}회</div>
                  <div>발음 명확성: {Math.round(speech.clarity * 100)}%</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 행동 분석 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            행동 패턴 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {Math.round(behavior.engagement.high * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">참여도</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {Math.round(behavior.posture.upright * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">바른 자세</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {Math.round(behavior.gestures.hand_movements * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">제스처 활용</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 개선建议 */}
      {recommendations && recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              개선 제안
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
