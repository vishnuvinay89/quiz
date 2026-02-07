import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  QuestionWithOptions,
  Attempt,
  AttemptAnswerInsert,
  QuizConfig,
} from '@/lib/supabase/types'

interface AnswerRecord {
  questionId: string
  selectedOptionId: string
  timeTakenSeconds: number
}

export function useQuizAttempt() {
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<string, AnswerRecord>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const startAttempt = useCallback(
    async (config: QuizConfig, userId: string) => {
      setLoading(true)
      setError(null)

      try {
        // Create attempt record
        const { data: attemptData, error: attemptError } = await supabase
          .from('attempts')
          .insert({
            user_id: userId,
            class: config.class,
            subject: config.subject,
            scope_type: config.mode,
            scope_value: config.mode === 'chapter' ? config.chapter! : config.topic!,
            question_count: parseInt(config.questionCount),
          })
          .select()
          .single()

        if (attemptError) throw attemptError

        // Fetch questions
        let query = supabase
          .from('questions')
          .select('*, question_options(*)')
          .eq('class', config.class)
          .eq('subject', config.subject)
          .eq('is_active', true)

        if (config.mode === 'chapter') {
          query = query.eq('chapter', config.chapter)
        } else {
          query = query.eq('topic', config.topic)
        }

        const { data: questionsData, error: questionsError } = await query

        if (questionsError) throw questionsError

        if (!questionsData || questionsData.length === 0) {
          throw new Error('No questions found for the selected criteria')
        }

        // Transform data structure: Supabase returns question_options, we need options
        const transformedQuestions = questionsData.map((q: any) => ({
          ...q,
          options: q.question_options || [],
        }))

        // Randomize questions and limit
        const shuffled = transformedQuestions.sort(() => Math.random() - 0.5)
        const limited = shuffled.slice(0, parseInt(config.questionCount))

        setAttempt(attemptData)
        setQuestions(limited as QuestionWithOptions[])
        setCurrentQuestionIndex(0)
        setAnswers(new Map())

        return { success: true, attempt: attemptData }
      } catch (err: any) {
        setError(err.message || 'Failed to start quiz attempt')
        return { success: false, error: err.message }
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  const saveAnswer = useCallback(
    async (questionId: string, selectedOptionId: string, timeTakenSeconds: number) => {
      if (!attempt) return

      // Update local state
      setAnswers((prev) => {
        const newMap = new Map(prev)
        newMap.set(questionId, {
          questionId,
          selectedOptionId,
          timeTakenSeconds,
        })
        return newMap
      })

      // Save to database
      try {
        const { error } = await supabase.from('attempt_answers').insert({
          attempt_id: attempt.id,
          question_id: questionId,
          selected_option_id: selectedOptionId,
          time_taken_seconds: timeTakenSeconds,
        })

        if (error) {
          console.error('Error saving answer:', error)
        }
      } catch (err) {
        console.error('Error in saveAnswer:', err)
      }
    },
    [attempt, supabase]
  )

  const nextQuestion = useCallback(() => {
    setCurrentQuestionIndex((prev) => Math.min(prev + 1, questions.length - 1))
  }, [questions.length])

  const previousQuestion = useCallback(() => {
    setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  const submitAttempt = useCallback(async () => {
    if (!attempt) return { success: false, error: 'No active attempt' }

    setLoading(true)
    try {
      // Calculate score
      let correctCount = 0
      const answerPromises: Promise<any>[] = []

      for (const [questionId, answer] of answers.entries()) {
        const question = questions.find((q) => q.id === questionId)
        if (!question) continue

        const correctOption = question.options.find((opt) => opt.is_correct)
        if (correctOption && correctOption.id === answer.selectedOptionId) {
          correctCount++
        }

        // Ensure answer is saved
        answerPromises.push(
          supabase.from('attempt_answers').upsert({
            attempt_id: attempt.id,
            question_id: questionId,
            selected_option_id: answer.selectedOptionId,
            time_taken_seconds: answer.timeTakenSeconds,
          })
        )
      }

      await Promise.all(answerPromises)

      const score = (correctCount / questions.length) * 100

      // Update attempt with score
      const { error: updateError } = await supabase
        .from('attempts')
        .update({
          score,
          completed_at: new Date().toISOString(),
        })
        .eq('id', attempt.id)

      if (updateError) throw updateError

      return { success: true, score, correctCount, totalQuestions: questions.length }
    } catch (err: any) {
      setError(err.message || 'Failed to submit attempt')
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [attempt, answers, questions, supabase])

  const reset = useCallback(() => {
    setAttempt(null)
    setQuestions([])
    setCurrentQuestionIndex(0)
    setAnswers(new Map())
    setError(null)
  }, [])

  return {
    attempt,
    questions,
    currentQuestionIndex,
    currentQuestion: questions[currentQuestionIndex] || null,
    answers,
    loading,
    error,
    startAttempt,
    saveAnswer,
    nextQuestion,
    previousQuestion,
    submitAttempt,
    reset,
    hasNext: currentQuestionIndex < questions.length - 1,
    hasPrevious: currentQuestionIndex > 0,
    progress: questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0,
  }
}
