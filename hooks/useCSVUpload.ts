import { useState } from 'react'
import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/client'
import type { QuestionInsert, QuestionOptionInsert } from '@/lib/supabase/types'

interface CSVQuestionRow {
  class: string
  subject: string
  chapter?: string
  topic?: string
  subtopic?: string
  question_text?: string
  question_image?: string
  option1_text?: string
  option1_image?: string
  option1_correct?: string
  option2_text?: string
  option2_image?: string
  option2_correct?: string
  option3_text?: string
  option3_image?: string
  option3_correct?: string
  option4_text?: string
  option4_image?: string
  option4_correct?: string
}

export function useCSVUpload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const supabase = createClient()

  const uploadCSV = async (file: File, imageMap: Map<string, string>) => {
    setLoading(true)
    setError(null)
    setProgress(0)

    return new Promise<{ success: boolean; processed: number; errors: string[] }>(
      (resolve) => {
        Papa.parse<CSVQuestionRow>(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            const errors: string[] = []
            let processed = 0

            try {
              for (let i = 0; i < results.data.length; i++) {
                const row = results.data[i]
                setProgress(((i + 1) / results.data.length) * 100)

                try {
                  // Validate required fields
                  if (!row.class || !row.subject) {
                    errors.push(`Row ${i + 2}: Missing class or subject`)
                    continue
                  }

                  const classNum = parseInt(row.class)
                  if (isNaN(classNum) || classNum < 6 || classNum > 10) {
                    errors.push(`Row ${i + 2}: Invalid class (must be 6-10)`)
                    continue
                  }

                  // Check if question has text or image
                  const questionImageUrl = row.question_image
                    ? imageMap.get(row.question_image) || null
                    : null

                  if (!row.question_text && !questionImageUrl) {
                    errors.push(`Row ${i + 2}: Question must have text or image`)
                    continue
                  }

                  // Insert question
                  const questionData: QuestionInsert = {
                    class: classNum,
                    subject: row.subject.trim(),
                    chapter: row.chapter?.trim() || null,
                    topic: row.topic?.trim() || null,
                    subtopic: row.subtopic?.trim() || null,
                    question_text: row.question_text?.trim() || null,
                    question_image_url: questionImageUrl,
                    is_active: true,
                  }

                  const { data: question, error: questionError } = await supabase
                    .from('questions')
                    .insert(questionData)
                    .select()
                    .single()

                  if (questionError) {
                    errors.push(`Row ${i + 2}: ${questionError.message}`)
                    continue
                  }

                  // Insert options
                  const options: QuestionOptionInsert[] = []
                  let correctOptionFound = false

                  for (let optNum = 1; optNum <= 4; optNum++) {
                    const optText = row[`option${optNum}_text` as keyof CSVQuestionRow] as
                      | string
                      | undefined
                    const optImage = row[`option${optNum}_image` as keyof CSVQuestionRow] as
                      | string
                      | undefined
                    const isCorrect =
                      row[`option${optNum}_correct` as keyof CSVQuestionRow] === 'true' ||
                      row[`option${optNum}_correct` as keyof CSVQuestionRow] === '1'

                    if (optText || optImage) {
                      const optionImageUrl = optImage ? imageMap.get(optImage) || null : null

                      options.push({
                        question_id: question.id,
                        option_text: optText?.trim() || null,
                        option_image_url: optionImageUrl,
                        is_correct: isCorrect,
                        option_order: optNum,
                      })

                      if (isCorrect) {
                        correctOptionFound = true
                      }
                    }
                  }

                  if (options.length === 0) {
                    errors.push(`Row ${i + 2}: No options provided`)
                    await supabase.from('questions').delete().eq('id', question.id)
                    continue
                  }

                  if (!correctOptionFound) {
                    errors.push(`Row ${i + 2}: No correct option marked`)
                    await supabase.from('questions').delete().eq('id', question.id)
                    continue
                  }

                  const { error: optionsError } = await supabase
                    .from('question_options')
                    .insert(options)

                  if (optionsError) {
                    errors.push(`Row ${i + 2}: ${optionsError.message}`)
                    await supabase.from('questions').delete().eq('id', question.id)
                    continue
                  }

                  processed++
                } catch (err: any) {
                  errors.push(`Row ${i + 2}: ${err.message || 'Unknown error'}`)
                }
              }

              resolve({ success: errors.length === 0, processed, errors })
            } catch (err: any) {
              setError(err.message || 'Failed to process CSV')
              resolve({ success: false, processed, errors: [err.message] })
            } finally {
              setLoading(false)
              setProgress(0)
            }
          },
          error: (error) => {
            setError(error.message)
            setLoading(false)
            resolve({ success: false, processed: 0, errors: [error.message] })
          },
        })
      }
    )
  }

  return {
    uploadCSV,
    loading,
    error,
    progress,
  }
}
