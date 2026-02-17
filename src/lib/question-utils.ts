import type { QuestionOption } from '@/types'

/**
 * QuestionOption 타입 가드
 */
export const isQuestionOption = (value: unknown): value is QuestionOption => {
  if (!value || typeof value !== 'object') return false
  const option = value as { id?: unknown; content?: unknown; isCorrect?: unknown }
  return (
    typeof option.id === 'string' &&
    typeof option.content === 'string' &&
    typeof option.isCorrect === 'boolean'
  )
}

/**
 * 옵션 배열을 QuestionOption 배열로 변환
 */
export const getQuestionOptions = (options: unknown): QuestionOption[] => {
  if (!Array.isArray(options)) return []
  return options.filter(isQuestionOption)
}

/**
 * 선택된 옵션들이 정답인지 확인
 */
export const checkOptionsCorrect = (
  questionOptions: QuestionOption[],
  selectedOptions: string[]
): boolean => {
  const correctOptions = questionOptions
    .filter((opt) => opt.isCorrect)
    .map((opt) => opt.id)
    .sort()

  const selected = selectedOptions.slice().sort()

  return (
    correctOptions.length === selected.length &&
    correctOptions.every((opt, idx) => opt === selected[idx])
  )
}
