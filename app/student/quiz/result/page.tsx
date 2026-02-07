'use client'

import Layout from '@/components/Layout'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Attempt, AttemptAnswer, QuestionWithOptions } from '@/lib/supabase/types'

function QuizResultContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const attemptId = searchParams.get('attempt')
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [answers, setAnswers] = useState<(AttemptAnswer & { question: QuestionWithOptions })[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (attemptId) {
      fetchResult()
    }
  }, [attemptId])

  const fetchResult = async () => {
    if (!attemptId) return

    try {
      const { data: attemptData, error: attemptError } = await supabase
        .from('attempts')
        .select('*')
        .eq('id', attemptId)
        .single()

      if (attemptError) throw attemptError
      setAttempt(attemptData)

      const { data: answersData, error: answersError } = await supabase
        .from('attempt_answers')
        .select('*, questions(*, question_options(*))')
        .eq('attempt_id', attemptId)

      if (answersError) throw answersError

      const formatted = (answersData || []).map((answer: any) => ({
        ...answer,
        question: {
          ...answer.questions,
          options: answer.questions.question_options || [],
        },
      }))

      setAnswers(formatted)
    } catch (error) {
      console.error('Error fetching result:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout requiredRole="student">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">Loading results...</div>
        </div>
      </Layout>
    )
  }

  if (!attempt) {
    return (
      <Layout requiredRole="student">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">Attempt not found</div>
        </div>
      </Layout>
    )
  }

  const getOptionStatus = (answer: typeof answers[0]) => {
    const correctOption = answer.question.options.find((opt) => opt.is_correct)
    const selectedOption = answer.question.options.find(
      (opt) => opt.id === answer.selected_option_id
    )

    if (selectedOption?.id === correctOption?.id) {
      return 'correct'
    }
    return 'incorrect'
  }

  return (
    <Layout requiredRole="student">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Results 🎉</h1>
          <div className="text-center mb-6">
            <div className="text-6xl font-bold text-primary-600 mb-2">
              {attempt.score?.toFixed(1)}%
            </div>
            <p className="text-gray-600">
              Class {attempt.class} - {attempt.subject}
              <br />
              {attempt.scope_type}: {attempt.scope_value}
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {answers.map((answer) => {
            const status = getOptionStatus(answer)
            const correctOption = answer.question.options.find((opt) => opt.is_correct)
            const selectedOption = answer.question.options.find(
              (opt) => opt.id === answer.selected_option_id
            )

            return (
              <div
                key={answer.id}
                className={`bg-white rounded-lg shadow-md p-6 border-2 ${
                  status === 'correct' ? 'border-green-200' : 'border-red-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {answer.question.question_text && (
                      <p className="font-semibold text-gray-900 mb-2">
                        {answer.question.question_text}
                      </p>
                    )}
                    {answer.question.question_image_url && (
                      <img
                        src={answer.question.question_image_url}
                        alt="Question"
                        className="rounded-lg mb-2 max-w-md"
                      />
                    )}
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      status === 'correct'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {status === 'correct' ? '✓ Correct' : '✗ Incorrect'}
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Your Answer:</p>
                    <div className="p-2 bg-gray-50 rounded">
                      {selectedOption?.option_text || (
                        <img
                          src={selectedOption?.option_image_url || ''}
                          alt="Selected"
                          className="max-w-xs"
                        />
                      )}
                    </div>
                  </div>
                  {status === 'incorrect' && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Correct Answer:</p>
                      <div className="p-2 bg-green-50 rounded">
                        {correctOption?.option_text || (
                          <img
                            src={correctOption?.option_image_url || ''}
                            alt="Correct"
                            className="max-w-xs"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <Link
            href="/student/dashboard"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </Layout>
  )
}

export default function QuizResultPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuizResultContent />
    </Suspense>
  )
}
