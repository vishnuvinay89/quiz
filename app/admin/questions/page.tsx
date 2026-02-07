'use client'

import Layout from '@/components/Layout'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Question } from '@/lib/supabase/types'

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    class: '',
    subject: '',
    isActive: '',
  })
  const supabase = createClient()

  useEffect(() => {
    fetchQuestions()
  }, [filters])

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      let query = supabase.from('questions').select('*').order('created_at', { ascending: false })

      if (filters.class) {
        query = query.eq('class', parseInt(filters.class))
      }
      if (filters.subject) {
        query = query.eq('subject', filters.subject)
      }
      if (filters.isActive !== '') {
        query = query.eq('is_active', filters.isActive === 'true')
      }

      const { data, error } = await query

      if (error) throw error
      setQuestions(data || [])
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      fetchQuestions()
    } catch (error) {
      console.error('Error toggling question:', error)
    }
  }

  return (
    <Layout requiredRole="admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Questions</h1>
          <Link
            href="/admin/questions/new"
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            + Add Question
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
              <select
                value={filters.class}
                onChange={(e) => setFilters({ ...filters, class: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Classes</option>
                {[6, 7, 8, 9, 10].map((cls) => (
                  <option key={cls} value={cls}>
                    Class {cls}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <select
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Subjects</option>
                {['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'].map(
                  (subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.isActive}
                onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No questions found</div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chapter/Topic
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question Preview
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questions.map((question) => (
                  <tr key={question.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">Class {question.class}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{question.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {question.chapter || question.topic || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {question.question_text || 'Image question'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(question.id, question.is_active)}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          question.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {question.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/admin/questions/${question.id}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
