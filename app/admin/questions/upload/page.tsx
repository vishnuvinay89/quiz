'use client'

import Layout from '@/components/Layout'
import { useCSVUpload } from '@/hooks/useCSVUpload'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function CSVUploadPage() {
  const { uploadCSV, loading, error, progress } = useCSVUpload()
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imageMap, setImageMap] = useState<Map<string, string>>(new Map())
  const [uploadingImages, setUploadingImages] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    processed: number
    errors: string[]
  } | null>(null)
  const supabase = createClient()

  const handleImageUpload = async () => {
    if (imageFiles.length === 0) return

    setUploadingImages(true)
    const newMap = new Map<string, string>()

    try {
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `questions/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file)

        if (uploadError) {
          console.error(`Error uploading ${file.name}:`, uploadError)
          continue
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('images').getPublicUrl(filePath)

        newMap.set(file.name, publicUrl)
      }

      setImageMap(newMap)
    } catch (err) {
      console.error('Error uploading images:', err)
    } finally {
      setUploadingImages(false)
    }
  }

  const handleCSVUpload = async () => {
    if (!csvFile) return

    const result = await uploadCSV(csvFile, imageMap)
    setResult(result)
  }

  return (
    <Layout requiredRole="admin">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Bulk Upload Questions</h1>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Upload Images</h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload all images first. The CSV should reference images by filename.
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <button
              onClick={handleImageUpload}
              disabled={imageFiles.length === 0 || uploadingImages}
              className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {uploadingImages ? 'Uploading Images...' : 'Upload Images'}
            </button>
            {imageMap.size > 0 && (
              <p className="mt-2 text-sm text-green-600">
                ✓ {imageMap.size} image(s) uploaded successfully
              </p>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 2: Upload CSV</h2>
            <p className="text-sm text-gray-600 mb-4">
              CSV format: class, subject, chapter, topic, subtopic, question_text, question_image,
              option1_text, option1_image, option1_correct, option2_text, option2_image,
              option2_correct, option3_text, option3_image, option3_correct, option4_text,
              option4_image, option4_correct
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {progress > 0 && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">{Math.round(progress)}%</p>
              </div>
            )}
            <button
              onClick={handleCSVUpload}
              disabled={!csvFile || loading}
              className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Upload CSV'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {result && (
            <div
              className={`border rounded-lg p-4 ${
                result.success
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-700'
              }`}
            >
              <p className="font-semibold mb-2">
                {result.success ? '✓ Upload Complete!' : '⚠ Upload Completed with Errors'}
              </p>
              <p>Processed: {result.processed} questions</p>
              {result.errors.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold">Errors:</p>
                  <ul className="list-disc list-inside mt-2">
                    {result.errors.map((err, idx) => (
                      <li key={idx} className="text-sm">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
