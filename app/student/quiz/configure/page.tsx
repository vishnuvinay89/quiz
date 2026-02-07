'use client'

import Layout from '@/components/Layout'
import { useQuizConfig } from '@/hooks/useQuizConfig'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function QuizConfigurePage() {
  const { config, errors, updateConfig, getValidatedConfig } = useQuizConfig()
  const [classes, setClasses] = useState<number[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [chapters, setChapters] = useState<string[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchClassesAndSubjects()
  }, [])

  useEffect(() => {
    // When class changes, fetch subjects for that class and reset subject selection
    if (config.class) {
      fetchSubjectsForClass(config.class)
      // Reset subject when class changes
      if (config.subject) {
        updateConfig({ subject: undefined })
      }
    } else {
      // If no class selected, show all subjects
      fetchAllSubjects()
      setChapters([])
      setTopics([])
    }
  }, [config.class])

  useEffect(() => {
    if (config.class && config.subject) {
      fetchChaptersAndTopics()
    } else {
      setChapters([])
      setTopics([])
    }
  }, [config.subject])

  const fetchClassesAndSubjects = async () => {
    setLoadingData(true)
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('class, subject')
        .eq('is_active', true)

      if (error) throw error

      if (data) {
        // Get unique classes
        const uniqueClasses = Array.from(
          new Set(data.map((q) => q.class).filter((c) => c >= 6 && c <= 10))
        ).sort((a, b) => a - b) as number[]

        setClasses(uniqueClasses)
        // Initially show all subjects
        await fetchAllSubjects()
      }
    } catch (error) {
      console.error('Error fetching classes and subjects:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const fetchAllSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('subject')
        .eq('is_active', true)

      if (error) throw error

      if (data) {
        const uniqueSubjects = Array.from(
          new Set(data.map((q) => q.subject).filter(Boolean))
        ).sort() as string[]

        setSubjects(uniqueSubjects)
      }
    } catch (error) {
      console.error('Error fetching all subjects:', error)
    }
  }

  const fetchSubjectsForClass = async (classNum: number) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('subject')
        .eq('class', classNum)
        .eq('is_active', true)

      if (error) throw error

      if (data) {
        const uniqueSubjects = Array.from(
          new Set(data.map((q) => q.subject).filter(Boolean))
        ).sort() as string[]

        setSubjects(uniqueSubjects)
      }
    } catch (error) {
      console.error('Error fetching subjects for class:', error)
    }
  }

  const fetchChaptersAndTopics = async () => {
    if (!config.class || !config.subject) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('chapter, topic')
        .eq('class', config.class)
        .eq('subject', config.subject)
        .eq('is_active', true)

      if (error) throw error

      if (data) {
        const uniqueChapters = Array.from(
          new Set(data.map((q) => q.chapter).filter(Boolean))
        ).sort() as string[]
        const uniqueTopics = Array.from(
          new Set(data.map((q) => q.topic).filter(Boolean))
        ).sort() as string[]
        setChapters(uniqueChapters)
        setTopics(uniqueTopics)
      }
    } catch (error) {
      console.error('Error fetching chapters and topics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validated = getValidatedConfig()
    if (validated) {
      // Store config in sessionStorage and navigate to quiz
      sessionStorage.setItem('quizConfig', JSON.stringify(validated))
      router.push('/student/quiz/attempt')
    }
  }

  if (loadingData) {
    return (
      <Layout requiredRole="student">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading available classes and subjects...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout requiredRole="student">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Configure Your Quiz 🎯</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={config.class || ''}
              onChange={(e) => updateConfig({ class: parseInt(e.target.value) })}
              required
              disabled={classes.length === 0}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {classes.length === 0 ? 'No classes available' : 'Select Class'}
              </option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>
            {errors.class && <p className="mt-1 text-sm text-red-600">{errors.class}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select
              value={config.subject || ''}
              onChange={(e) => updateConfig({ subject: e.target.value })}
              required
              disabled={subjects.length === 0}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {subjects.length === 0 ? 'No subjects available' : 'Select Subject'}
              </option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Mode</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="mode"
                  value="chapter"
                  checked={config.mode === 'chapter'}
                  onChange={(e) => updateConfig({ mode: 'chapter' as const, topic: undefined })}
                  className="mr-2"
                />
                Chapter-wise
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="mode"
                  value="topic"
                  checked={config.mode === 'topic'}
                  onChange={(e) => updateConfig({ mode: 'topic' as const, chapter: undefined })}
                  className="mr-2"
                />
                Topic-wise
              </label>
            </div>
            {errors.mode && <p className="mt-1 text-sm text-red-600">{errors.mode}</p>}
          </div>

          {config.mode === 'chapter' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chapter</label>
              <select
                value={config.chapter || ''}
                onChange={(e) => updateConfig({ chapter: e.target.value })}
                required
                disabled={loading || chapters.length === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loading
                    ? 'Loading chapters...'
                    : chapters.length === 0
                      ? 'No chapters available'
                      : 'Select Chapter'}
                </option>
                {chapters.map((chapter) => (
                  <option key={chapter} value={chapter}>
                    {chapter}
                  </option>
                ))}
              </select>
              {errors.chapter && <p className="mt-1 text-sm text-red-600">{errors.chapter}</p>}
            </div>
          )}

          {config.mode === 'topic' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
              <select
                value={config.topic || ''}
                onChange={(e) => updateConfig({ topic: e.target.value })}
                required
                disabled={loading || topics.length === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loading
                    ? 'Loading topics...'
                    : topics.length === 0
                      ? 'No topics available'
                      : 'Select Topic'}
                </option>
                {topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
              {errors.topic && <p className="mt-1 text-sm text-red-600">{errors.topic}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Questions
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="questionCount"
                  value="10"
                  checked={config.questionCount === '10'}
                  onChange={(e) => updateConfig({ questionCount: '10' as const })}
                  className="mr-2"
                />
                10 Questions
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="questionCount"
                  value="20"
                  checked={config.questionCount === '20'}
                  onChange={(e) => updateConfig({ questionCount: '20' as const })}
                  className="mr-2"
                />
                20 Questions
              </label>
            </div>
            {errors.questionCount && (
              <p className="mt-1 text-sm text-red-600">{errors.questionCount}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Starting Quiz...' : 'Start Quiz 🚀'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
