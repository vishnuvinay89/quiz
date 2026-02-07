'use client'

import Layout from '@/components/Layout'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function AdminAnalyticsPage() {
  const [chapterData, setChapterData] = useState<any[]>([])
  const [topicData, setTopicData] = useState<any[]>([])
  const [questionData, setQuestionData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      // Chapter vs Topic difficulty
      const { data: chapterAttempts } = await supabase
        .from('attempts')
        .select('scope_value, score')
        .eq('scope_type', 'chapter')

      const { data: topicAttempts } = await supabase
        .from('attempts')
        .select('scope_value, score')
        .eq('scope_type', 'topic')

      // Process chapter data
      const chapterMap = new Map<string, { total: number; sum: number }>()
      if (chapterAttempts) {
        (chapterAttempts as Array<{ scope_value: string; score: number | null }>).forEach((attempt) => {
          if (attempt.score !== null) {
            const existing = chapterMap.get(attempt.scope_value) || { total: 0, sum: 0 }
            chapterMap.set(attempt.scope_value, {
              total: existing.total + 1,
              sum: existing.sum + attempt.score,
            })
          }
        })
      }

      const chapterStats = Array.from(chapterMap.entries()).map(([name, data]) => ({
        name,
        average: data.sum / data.total,
        attempts: data.total,
      }))
      setChapterData(chapterStats)

      // Process topic data
      const topicMap = new Map<string, { total: number; sum: number }>()
      if (topicAttempts) {
        (topicAttempts as Array<{ scope_value: string; score: number | null }>).forEach((attempt) => {
          if (attempt.score !== null) {
            const existing = topicMap.get(attempt.scope_value) || { total: 0, sum: 0 }
            topicMap.set(attempt.scope_value, {
              total: existing.total + 1,
              sum: existing.sum + attempt.score,
            })
          }
        })
      }

      const topicStats = Array.from(topicMap.entries()).map(([name, data]) => ({
        name,
        average: data.sum / data.total,
        attempts: data.total,
      }))
      setTopicData(topicStats)

      // Question success rate (simplified - would need proper joins in real app)
      const { data: allAnswers } = await supabase
        .from('attempt_answers')
        .select('question_id, selected_option_id, question_options!inner(is_correct)')

      // This is simplified - in production, use proper SQL views
      setQuestionData([])
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout requiredRole="admin">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Loading analytics...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout requiredRole="admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Chapter Performance (Average Score)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chapterData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="average" fill="#0ea5e9" name="Average Score %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Topic Performance (Average Score)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topicData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="average" fill="#10b981" name="Average Score %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Top Performing Chapters</h3>
              <ul className="space-y-2">
                {chapterData
                  .sort((a, b) => b.average - a.average)
                  .slice(0, 5)
                  .map((item) => (
                    <li key={item.name} className="flex justify-between">
                      <span>{item.name}</span>
                      <span className="font-semibold">{item.average.toFixed(1)}%</span>
                    </li>
                  ))}
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Chapters Needing Attention</h3>
              <ul className="space-y-2">
                {chapterData
                  .sort((a, b) => a.average - b.average)
                  .slice(0, 5)
                  .map((item) => (
                    <li key={item.name} className="flex justify-between">
                      <span>{item.name}</span>
                      <span className="font-semibold">{item.average.toFixed(1)}%</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
