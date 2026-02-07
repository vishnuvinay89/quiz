'use client'

import Layout from '@/components/Layout'
import { useQuizAttempt } from '@/hooks/useQuizAttempt'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
// Using img tag for dynamic images from Supabase
import type { QuizConfig } from '@/hooks/useQuizConfig'

export default function QuizAttemptPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [config, setConfig] = useState<QuizConfig | null>(null)
  const [started, setStarted] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const {
    attempt,
    currentQuestion,
    currentQuestionIndex,
    questions,
    answers,
    loading,
    error,
    startAttempt,
    saveAnswer,
    nextQuestion,
    previousQuestion,
    submitAttempt,
    hasNext,
    hasPrevious,
    progress,
  } = useQuizAttempt()

  useEffect(() => {
    const stored = sessionStorage.getItem('quizConfig')
    if (!stored) {
      // Use setTimeout to defer navigation after render
      const timer = setTimeout(() => {
        router.push('/student/quiz/configure')
      }, 0)
      return () => clearTimeout(timer)
    }
    try {
      const parsedConfig = JSON.parse(stored)
      setConfig(parsedConfig)
    } catch (err) {
      console.error('Error parsing quiz config:', err)
      const timer = setTimeout(() => {
        router.push('/student/quiz/configure')
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [router])

  useEffect(() => {
    if (currentQuestion) {
      setQuestionStartTime(Date.now())
    }
  }, [currentQuestionIndex, currentQuestion])

  const handleStart = async () => {
    if (!config || !user) return
    const result = await startAttempt(config, user.id)
    if (result.success) {
      setStarted(true)
    }
  }

  const handleOptionSelect = async (optionId: string) => {
    if (!currentQuestion) return

    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000)
    await saveAnswer(currentQuestion.id, optionId, timeTaken)
  }

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit? You cannot change answers after submitting.')) {
      return
    }

    const result = await submitAttempt()
    if (result.success) {
      sessionStorage.removeItem('quizConfig')
      router.push(`/student/quiz/result?attempt=${attempt?.id}`)
    }
  }

  if (!config) {
    return (
      <Layout requiredRole="student">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </Layout>
    )
  }

  if (!started && !attempt) {
    return (
      <Layout requiredRole="student">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Ready to Start? 🚀</h1>
            <p className="text-gray-600 mb-6">
              Class {config.class} - {config.subject}
              <br />
              {config.mode === 'chapter' ? `Chapter: ${config.chapter}` : `Topic: ${config.topic}`}
              <br />
              {config.questionCount} questions
            </p>
            <button
              onClick={handleStart}
              disabled={loading}
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Starting...' : 'Start Quiz'}
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout requiredRole="student">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </Layout>
    )
  }

  if (!currentQuestion) {
    return (
      <Layout requiredRole="student">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">Loading question...</div>
        </div>
      </Layout>
    )
  }

  const selectedOptionId = answers.get(currentQuestion.id)?.selectedOptionId

  return (
    <Layout requiredRole="student">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-6">
            {currentQuestion.question_text && (
              <p className="text-xl font-semibold text-gray-900 mb-4">
                {currentQuestion.question_text}
              </p>
            )}
            {currentQuestion.question_image_url && (
              <div className="mb-4">
                <img
                  src={currentQuestion.question_image_url}
                  alt="Question"
                  className="rounded-lg max-w-full h-auto"
                />
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options && currentQuestion.options.length > 0 ? (
              currentQuestion.options
                .sort((a, b) => a.option_order - b.option_order)
                .map((option) => {
                  const isSelected = selectedOptionId === option.id
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(option.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          {option.option_text && (
                            <p className="text-gray-900">{option.option_text}</p>
                          )}
                          {option.option_image_url && (
                            <div className="mt-2">
                              <img
                                src={option.option_image_url}
                                alt="Option"
                                className="rounded max-w-xs h-auto"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
            ) : (
              <div className="text-center text-gray-500 py-4">
                No options available for this question
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={previousQuestion}
            disabled={!hasPrevious}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          {hasNext ? (
            <button
              onClick={nextQuestion}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Quiz ✓'}
            </button>
          )}
        </div>
      </div>
    </Layout>
  )
}
