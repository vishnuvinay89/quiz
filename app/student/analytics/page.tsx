'use client'

import Layout from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
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
import type { Attempt } from '@/lib/supabase/types'

export default function StudentAnalyticsPage() {
  const { user } = useAuth()
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [chapterData, setChapterData] = useState<any[]>([])
  const [topicData, setTopicData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user])

  const fetchAnalytics = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAttempts(data || [])

      // Process chapter data
      const chapterMap = new Map<string, { total: number; sum: number }>()
      const topicMap = new Map<string, { total: number; sum: number }>()

      data?.forEach((attempt) => {
        if (attempt.score !== null) {
          if (attempt.scope_type === 'chapter') {
            const existing = chapterMap.get(attempt.scope_value) || { total: 0, sum: 0 }
            chapterMap.set(attempt.scope_value, {
              total: existing.total + 1,
              sum: existing.sum + attempt.score,
            })
          } else {
            const existing = topicMap.get(attempt.scope_value) || { total: 0, sum: 0 }
            topicMap.set(attempt.scope_value, {
              total: existing.total + 1,
              sum: existing.sum + attempt.score,
            })
          }
        }
      })

      setChapterData(
        Array.from(chapterMap.entries()).map(([name, data]) => ({
          name,
          average: data.sum / data.total,
          attempts: data.total,
        }))
      )

      setTopicData(
        Array.from(topicMap.entries()).map(([name, data]) => ({
          name,
          average: data.sum / data.total,
          attempts: data.total,
        }))
      )
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout requiredRole="student">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Loading analytics...</div>
        </div>
      </Layout>
    )
  }

  const scoreTrend = attempts
    .filter((a) => a.score !== null)
    .slice(0, 10)
    .reverse()
    .map((attempt, index) => ({
      attempt: index + 1,
      score: attempt.score!,
      date: new Date(attempt.created_at).toLocaleDateString(),
    }))

  return (
    <Layout requiredRole="student">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Analytics 📊</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Score Trend</h2>
            {scoreTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={scoreTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="attempt" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#0ea5e9"
                    name="Score %"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">No attempts yet</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Chapter Accuracy</h2>
            {chapterData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chapterData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="average" fill="#0ea5e9" name="Accuracy %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">No chapter attempts yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Topic Accuracy</h2>
          {topicData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topicData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="average" fill="#10b981" name="Accuracy %" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No topic attempts yet</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Attempts</h2>
          {attempts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No attempts yet</p>
          ) : (
            <div className="space-y-4">
              {attempts.slice(0, 10).map((attempt) => (
                <div
                  key={attempt.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">
                        Class {attempt.class} - {attempt.subject}
                      </p>
                      <p className="text-sm text-gray-600">
                        {attempt.scope_type}: {attempt.scope_value} • {attempt.question_count}{' '}
                        questions
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(attempt.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {attempt.score !== null ? (
                        <p className="text-lg font-semibold text-primary-600">
                          {attempt.score.toFixed(1)}%
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">In Progress</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
