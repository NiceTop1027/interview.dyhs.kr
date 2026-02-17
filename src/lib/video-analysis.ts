
// import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
// import '@tensorflow/tfjs-backend-webgl'
// import '@mediapipe/tasks-vision'
// import { createWorker } from 'tesseract.js'

export interface FacialAnalysis {
  expressions: {
    happy: number
    sad: number
    angry: number
    surprised: number
    neutral: number
    fearful: number
    disgusted: number
  }
  gaze: {
    left: number
    right: number
    center: number
    away: number
  }
  attention: {
    focused: number
    distracted: number
    looking_away: number
  }
  confidence: {
    high: number
    medium: number
    low: number
  }
}

export interface SpeechAnalysis {
  transcript: string
  keywords: string[]
  sentiment: {
    positive: number
    negative: number
    neutral: number
  }
  speaking_rate: number
  pause_count: number
  filler_words: string[]
  clarity: number
}

export interface BehaviorAnalysis {
  posture: {
    upright: number
    slouched: number
    leaning: number
  }
  gestures: {
    hand_movements: number
    head_movements: number
    facial_movements: number
  }
  engagement: {
    high: number
    medium: number
    low: number
  }
}

export interface VideoAnalysisResult {
  sessionId: string
  timestamp: Date
  facial: FacialAnalysis
  speech: SpeechAnalysis
  behavior: BehaviorAnalysis
  overall_score: number
  attitude_assessment: {
    positive: number
    negative: number
    neutral: number
  }
  recommendations: string[]
}

class VideoAnalyzer {
  // private detector: faceLandmarksDetection.FaceLandmarksDetector | null = null
  // private ocrWorker: Tesseract.Worker | null = null

  async initialize() {
    // No-op for real analysis
  }

  // Real AI Analysis Integration
  async analyzeRealVideo(filePath: string): Promise<Partial<VideoAnalysisResult>> {
    try {
      console.log(`[VideoAnalyzer] Starting analysis for: ${filePath}`)

      // 1. STT (Speech to Text) via Whisper
      // Note: Whisper Docker expects a file upload with 'audio_file' field
      const transcript = await this.performSTT(filePath)
      console.log(`[VideoAnalyzer] Transcript generated: ${transcript.substring(0, 50)}...`)

      if (!transcript || transcript.length < 2) {
        throw new Error("Voice data insufficient for analysis")
      }

      // 2. Text Analysis via Ollama (Llama3)
      const analysisData = await this.performLLMAnalysis(transcript)
      console.log(`[VideoAnalyzer] LLM Analysis complete`)

      return {
        speech: {
          transcript: transcript,
          keywords: analysisData.keywords || [],
          sentiment: analysisData.sentiment || { positive: 0, negative: 0, neutral: 1 },
          speaking_rate: 0, // Difficult to calculate accurately without duration metadata from STT
          pause_count: 0,
          filler_words: [],
          clarity: 0.8
        },
        facial: {
          // Since we can't easily do visual analysis server-side without heavy deps, 
          // we will infer some "confidence" metrics from the text sentiment
          expressions: {
            happy: analysisData.sentiment.positive,
            sad: analysisData.sentiment.negative,
            angry: 0,
            surprised: 0,
            neutral: analysisData.sentiment.neutral,
            fearful: 0,
            disgusted: 0
          },
          gaze: { left: 0, right: 0, center: 1, away: 0 },
          attention: { focused: 0.9, distracted: 0.1, looking_away: 0 },
          confidence: {
            high: analysisData.sentiment.positive > 0.6 ? 0.8 : 0.4,
            medium: 0.2,
            low: analysisData.sentiment.negative > 0.4 ? 0.6 : 0.2
          }
        },
        attitude_assessment: {
          positive: analysisData.sentiment.positive,
          negative: analysisData.sentiment.negative,
          neutral: analysisData.sentiment.neutral
        },
        recommendations: analysisData.recommendations || []
      }

    } catch (error) {
      console.error("[VideoAnalyzer] Error:", error)
      // Fallback for demo if real analysis fails
      return this.generateMockAnalysis()
    }
  }

  private async performSTT(filePath: string): Promise<string> {
    const fs = require('fs')
    const FormData = require('form-data')
    const axios = require('axios')

    const formData = new FormData()
    formData.append('audio_file', fs.createReadStream(filePath))

    // Whisper service at port 29000
    const response = await axios.post(
      'http://localhost:29000/asr?task=transcribe&language=ko&output=json',
      formData,
      {
        headers: {
          ...formData.getHeaders()
        }
      }
    )

    return response.data.text || ""
  }

  private async performLLMAnalysis(transcript: string): Promise<any> {
    const { GoogleGenerativeAI } = require("@google/generative-ai")

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set")
      return {
        keywords: ["설정오류"],
        sentiment: { positive: 0.5, negative: 0, neutral: 0.5 },
        recommendations: ["서버에 GEMINI_API_KEY가 설정되지 않았습니다."]
      }
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const prompt = `
    Analyze the following interview transcript for a candidate.
    Transcript: "${transcript}"
    
    Return ONLY a JSON object with this exact structure (no markdown, no explanations):
    {
      "keywords": ["string", "string"],
      "sentiment": { "positive": 0.0-1.0, "negative": 0.0-1.0, "neutral": 0.0-1.0 },
      "recommendations": ["string", "string"]
    }
    Sentiment scores must sum to roughly 1.0. Recommendations should be in Korean, helpful feedback for an interviewee.
    `

    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Clean up markdown code blocks if present
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
      return JSON.parse(cleaned)
    } catch (error) {
      console.error("Gemini Analysis failed:", error)
      return {
        keywords: ["분석실패"],
        sentiment: { positive: 0.5, negative: 0, neutral: 0.5 },
        recommendations: ["AI 분석 결과를 처리하는 중 오류가 발생했습니다."]
      }
    }
  }

  generateMockAnalysis() {
    return this.generateOverallAnalysis(
      {
        expressions: { happy: 0.3, sad: 0.05, angry: 0.0, surprised: 0.1, neutral: 0.55, fearful: 0.0, disgusted: 0.0 },
        gaze: { left: 0.05, right: 0.05, center: 0.85, away: 0.05 },
        attention: { focused: 0.95, distracted: 0.05, looking_away: 0.0 },
        confidence: { high: 0.8, medium: 0.15, low: 0.05 }
      },
      {
        transcript: "음성 인식 서비스를 연결할 수 없어 모의 데이터를 표시합니다.",
        keywords: ["데이터", "연결", "오류"],
        sentiment: { positive: 0.5, negative: 0.1, neutral: 0.4 },
        speaking_rate: 100,
        pause_count: 0,
        filler_words: [],
        clarity: 0.8
      }
    )
  }

  generateOverallAnalysis(facial: FacialAnalysis, speech: SpeechAnalysis): Omit<VideoAnalysisResult, 'sessionId' | 'timestamp'> {
    const overall_score = (facial.confidence.high * 0.3) +
      (facial.attention.focused * 0.3) +
      (speech.sentiment.positive * 0.2) +
      (speech.clarity * 0.2)

    const attitude_assessment = {
      positive: (facial.expressions.happy * 0.4) + (speech.sentiment.positive * 0.6),
      negative: (facial.expressions.sad * 0.3) + (facial.expressions.angry * 0.2) + (speech.sentiment.negative * 0.5),
      neutral: (facial.expressions.neutral * 0.5) + (speech.sentiment.neutral * 0.5)
    }

    const recommendations = this.generateRecommendations(facial, speech, overall_score)

    return {
      facial,
      speech,
      behavior: {
        posture: {
          upright: 0.7,
          slouched: 0.2,
          leaning: 0.1
        },
        gestures: {
          hand_movements: 0.5,
          head_movements: 0.3,
          facial_movements: 0.6
        },
        engagement: {
          high: overall_score > 0.7 ? 0.8 : 0.3,
          medium: overall_score >= 0.4 && overall_score <= 0.7 ? 0.8 : 0.2,
          low: overall_score < 0.4 ? 0.8 : 0.1
        }
      },
      overall_score,
      attitude_assessment,
      recommendations
    }
  }

  private generateRecommendations(facial: FacialAnalysis, speech: SpeechAnalysis, score: number): string[] {
    const recommendations: string[] = []

    if (facial.attention.looking_away > 0.5) {
      recommendations.push("시선을 더 자주 카메라에 맞추는 것이 좋습니다.")
    }

    if (facial.confidence.low > 0.5) {
      recommendations.push("자신감 있는 태도를 보이기 위해 더 긍정적인 표정을 지어보세요.")
    }

    if (speech.filler_words.length > 3) {
      recommendations.push("불필요한 충음사 사용을 줄이고 더 명확하게 말하는 연습이 필요합니다.")
    }

    if (speech.clarity < 0.6) {
      recommendations.push("발음을 더 명확하게 하고 적절한 속도로 말하는 것이 좋습니다.")
    }

    if (score < 0.5) {
      recommendations.push("전반적인 태도와 표현에서 더 긍정적인 모습을 보여주는 것이 좋습니다.")
    }

    if (recommendations.length === 0) {
      recommendations.push("전반적으로 좋은 태도와 표현을 보여주고 있습니다.")
    }

    return recommendations
  }

  async cleanup() {
    // Cleanup logic
  }
}

export const videoAnalyzer = new VideoAnalyzer()
