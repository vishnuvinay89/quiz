'use client'

import Layout from '@/components/Layout'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalQuestions: 0,
    activeQuestions: 0,
    totalAttempts: 0,
    totalStudents: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [questions, activeQuestions, attempts, students] = await Promise.all([
        supabase.from('questions').select('id', { count: 'exact', head: true }),
        supabase
          .from('questions')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase.from('attempts').select('id', { count: 'exact', head: true }),
        supabase.from('attempts').select('user_id', { count: 'exact', head: true }),
      ])

      setStats({
        totalQuestions: questions.count || 0,
        activeQuestions: activeQuestions.count || 0,
        totalAttempts: attempts.count || 0,
        totalStudents: students.count || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout requiredRole="admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard 📊</h1>

        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-primary-600">{stats.totalQuestions}</div>
              <div className="text-gray-600">Total Questions</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-green-600">{stats.activeQuestions}</div>
              <div className="text-gray-600">Active Questions</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.totalAttempts}</div>
              <div className="text-gray-600">Total Attempts</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-2xl font-bold text-purple-600">{stats.totalStudents}</div>
              <div className="text-gray-600">Total Students</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/questions"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-primary-200 hover:border-primary-400"
          >
            <div className="text-4xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Manage Questions</h2>
            <p className="text-gray-600">Add, edit, and manage questions</p>
          </Link>

          <Link
            href="/admin/analytics"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-primary-200 hover:border-primary-400"
          >
            <div className="text-4xl mb-4">📈</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics</h2>
            <p className="text-gray-600">View performance analytics</p>
          </Link>

          <Link
            href="/admin/questions/upload"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-primary-200 hover:border-primary-400"
          >
            <div className="text-4xl mb-4">📤</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Bulk Upload</h2>
            <p className="text-gray-600">Upload questions via CSV</p>
          </Link>
        </div>
      </div>
    </Layout>
  )
}
