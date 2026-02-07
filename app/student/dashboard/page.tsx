'use client'

import Layout from '@/components/Layout'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { Attempt } from '@/lib/supabase/types'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [recentAttempts, setRecentAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchRecentAttempts()
    }
  }, [user])

  const fetchRecentAttempts = async () => {
    if (!user) return

    const supabase = createClient()
    const { data, error } = await supabase
      .from('attempts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (!error && data) {
      setRecentAttempts(data)
    }
    setLoading(false)
  }

  return (
    <Layout requiredRole="student">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, Student! 🎓</h1>
          <p className="text-gray-600">Ready to test your knowledge?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/student/quiz/configure"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-primary-200 hover:border-primary-400"
          >
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Start New Quiz</h2>
            <p className="text-gray-600">Take a quiz on any chapter or topic</p>
          </Link>

          <Link
            href="/student/analytics"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-primary-200 hover:border-primary-400"
          >
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">View Analytics</h2>
            <p className="text-gray-600">See your performance and progress</p>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Attempts</h2>
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : recentAttempts.length === 0 ? (
            <div className="text-gray-500">No attempts yet. Start your first quiz!</div>
          ) : (
            <div className="space-y-4">
              {recentAttempts.map((attempt) => (
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
                    </div>
                    <div className="text-right">
                      {attempt.score !== null ? (
                        <>
                          <p className="text-lg font-semibold text-primary-600">
                            {attempt.score.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(attempt.created_at).toLocaleDateString()}
                          </p>
                        </>
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
