'use client'

import Layout from '@/components/Layout'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import ImageUpload from '@/components/ImageUpload'
import type { Question, QuestionOption } from '@/lib/supabase/types'

const CLASSES = [6, 7, 8, 9, 10]
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi']

export default function EditQuestionPage() {
  const router = useRouter()
  const params = useParams()
  const questionId = params.id as string
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [question, setQuestion] = useState<Question | null>(null)
  const [options, setOptions] = useState<QuestionOption[]>([])
  const [formData, setFormData] = useState({
    class: '',
    subject: '',
    chapter: '',
    topic: '',
    subtopic: '',
    question_text: '',
    question_image_url: '',
    is_active: true,
  })

  useEffect(() => {
    if (questionId) {
      fetchQuestion()
    }
  }, [questionId])

  const fetchQuestion = async () => {
    try {
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single()

      if (questionError) throw questionError

      setQuestion(questionData)
      setFormData({
        class: questionData.class.toString(),
        subject: questionData.subject,
        chapter: questionData.chapter || '',
        topic: questionData.topic || '',
        subtopic: questionData.subtopic || '',
        question_text: questionData.question_text || '',
        question_image_url: questionData.question_image_url || '',
        is_active: questionData.is_active,
      })

      const { data: optionsData, error: optionsError } = await supabase
        .from('question_options')
        .select('*')
        .eq('question_id', questionId)
        .order('option_order')

      if (optionsError) throw optionsError
      setOptions(optionsData || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load question')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      // Validate question has text or image
      if (!formData.question_text && !formData.question_image_url) {
        setError('Question must have either text or image')
        setSaving(false)
        return
      }

      // Update question
      const { error: updateError } = await supabase
        .from('questions')
        .update({
          class: parseInt(formData.class),
          subject: formData.subject,
          chapter: formData.chapter || null,
          topic: formData.topic || null,
          subtopic: formData.subtopic || null,
          question_text: formData.question_text || null,
          question_image_url: formData.question_image_url || null,
          is_active: formData.is_active,
        })
        .eq('id', questionId)

      if (updateError) throw updateError

      // Update options
      for (const option of options) {
        const { error: optionError } = await supabase
          .from('question_options')
          .update({
            option_text: option.option_text,
            option_image_url: option.option_image_url,
            is_correct: option.is_correct,
          })
          .eq('id', option.id)

        if (optionError) throw optionError
      }

      router.push('/admin/questions')
    } catch (err: any) {
      setError(err.message || 'Failed to update question')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout requiredRole="admin">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </Layout>
    )
  }

  if (!question) {
    return (
      <Layout requiredRole="admin">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">Question not found</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout requiredRole="admin">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Question</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
              <select
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                {CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    Class {cls}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                {SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chapter</label>
              <input
                type="text"
                value={formData.chapter}
                onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subtopic</label>
              <input
                type="text"
                value={formData.subtopic}
                onChange={(e) => setFormData({ ...formData, subtopic: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
            <textarea
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Question Image</label>
            <ImageUpload
              onUploadComplete={(url) => setFormData({ ...formData, question_image_url: url })}
            />
            {formData.question_image_url && (
              <img
                src={formData.question_image_url}
                alt="Question"
                className="mt-2 max-w-md rounded-lg"
              />
            )}
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="mr-2"
              />
              Active
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">Options</label>
            <div className="space-y-4">
              {options.map((option, index) => (
                <div key={option.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={option.is_correct}
                      onChange={(e) => {
                        const newOptions = [...options]
                        newOptions[index].is_correct = e.target.checked
                        setOptions(newOptions)
                      }}
                      className="mr-2"
                    />
                    <span className="font-medium">Option {index + 1}</span>
                  </div>
                  <input
                    type="text"
                    value={option.option_text || ''}
                    onChange={(e) => {
                      const newOptions = [...options]
                      newOptions[index].option_text = e.target.value
                      setOptions(newOptions)
                    }}
                    placeholder="Option text..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
                  />
                  <ImageUpload
                    onUploadComplete={(url) => {
                      const newOptions = [...options]
                      newOptions[index].option_image_url = url
                      setOptions(newOptions)
                    }}
                  />
                  {option.option_image_url && (
                    <img
                      src={option.option_image_url}
                      alt={`Option ${index + 1}`}
                      className="mt-2 max-w-xs rounded"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
