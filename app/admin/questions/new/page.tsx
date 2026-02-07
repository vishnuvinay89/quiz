'use client'

import Layout from '@/components/Layout'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ImageUpload from '@/components/ImageUpload'
import type { QuestionInsert, QuestionOptionInsert } from '@/lib/supabase/types'

const CLASSES = [6, 7, 8, 9, 10]
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi']

export default function NewQuestionPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    class: '',
    subject: '',
    chapter: '',
    topic: '',
    subtopic: '',
    question_text: '',
    question_image_url: '',
  })
  const [options, setOptions] = useState<
    Array<{
      text: string
      image_url: string
      is_correct: boolean
    }>
  >([
    { text: '', image_url: '', is_correct: false },
    { text: '', image_url: '', is_correct: false },
    { text: '', image_url: '', is_correct: false },
    { text: '', image_url: '', is_correct: false },
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate question has text or image
      if (!formData.question_text && !formData.question_image_url) {
        setError('Question must have either text or image')
        setLoading(false)
        return
      }

      // Validate at least one correct option
      const hasCorrectOption = options.some((opt) => opt.is_correct)
      if (!hasCorrectOption) {
        setError('At least one option must be marked as correct')
        setLoading(false)
        return
      }

      // Validate each option has text or image
      const validOptions = options.filter((opt) => opt.text || opt.image_url)
      if (validOptions.length < 2) {
        setError('At least 2 options are required')
        setLoading(false)
        return
      }

      // Insert question
      const questionData: QuestionInsert = {
        class: parseInt(formData.class),
        subject: formData.subject,
        chapter: formData.chapter || null,
        topic: formData.topic || null,
        subtopic: formData.subtopic || null,
        question_text: formData.question_text || null,
        question_image_url: formData.question_image_url || null,
        is_active: true,
      }

      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert(questionData)
        .select()
        .single()

      if (questionError) throw questionError

      // Insert options
      const optionsData: QuestionOptionInsert[] = validOptions.map((opt, index) => ({
        question_id: question.id,
        option_text: opt.text || null,
        option_image_url: opt.image_url || null,
        is_correct: opt.is_correct,
        option_order: index + 1,
      }))

      const { error: optionsError } = await supabase.from('question_options').insert(optionsData)

      if (optionsError) throw optionsError

      router.push('/admin/questions')
    } catch (err: any) {
      setError(err.message || 'Failed to create question')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout requiredRole="admin">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Question</h1>

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
                <option value="">Select Class</option>
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
                <option value="">Select Subject</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text
            </label>
            <textarea
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter question text..."
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
            <label className="block text-sm font-medium text-gray-700 mb-4">Options *</label>
            <div className="space-y-4">
              {options.map((option, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
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
                    value={option.text}
                    onChange={(e) => {
                      const newOptions = [...options]
                      newOptions[index].text = e.target.value
                      setOptions(newOptions)
                    }}
                    placeholder="Option text..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
                  />
                  <ImageUpload
                    onUploadComplete={(url) => {
                      const newOptions = [...options]
                      newOptions[index].image_url = url
                      setOptions(newOptions)
                    }}
                  />
                  {option.image_url && (
                    <img
                      src={option.image_url}
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
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Question'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
