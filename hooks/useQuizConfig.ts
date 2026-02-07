import { useState } from 'react'
import { z } from 'zod'

const quizConfigSchema = z.object({
  class: z.number().min(6).max(10),
  subject: z.string().min(1),
  mode: z.enum(['chapter', 'topic']),
  chapter: z.string().optional(),
  topic: z.string().optional(),
  questionCount: z.enum(['10', '20']),
}).refine(
  (data) => {
    if (data.mode === 'chapter') {
      return !!data.chapter && !data.topic
    }
    if (data.mode === 'topic') {
      return !!data.topic && !data.chapter
    }
    return false
  },
  {
    message: 'Either chapter or topic must be selected based on mode',
  }
)

export type QuizConfig = z.infer<typeof quizConfigSchema>

export function useQuizConfig() {
  const [config, setConfig] = useState<Partial<QuizConfig>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateConfig = (updates: Partial<QuizConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
    // Clear errors for updated fields
    setErrors((prev) => {
      const newErrors = { ...prev }
      Object.keys(updates).forEach((key) => {
        delete newErrors[key]
      })
      return newErrors
    })
  }

  const validate = (): boolean => {
    try {
      quizConfigSchema.parse(config)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const getValidatedConfig = (): QuizConfig | null => {
    if (validate()) {
      return config as QuizConfig
    }
    return null
  }

  const reset = () => {
    setConfig({})
    setErrors({})
  }

  return {
    config,
    errors,
    updateConfig,
    validate,
    getValidatedConfig,
    reset,
  }
}
