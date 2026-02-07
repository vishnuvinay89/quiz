'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ImageUploadProps {
  onUploadComplete: (url: string) => void
  folder?: string
}

export default function ImageUpload({ onUploadComplete, folder = 'questions' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    setUploading(true)
    setError('')

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('images').getPublicUrl(filePath)

      onUploadComplete(publicUrl)
    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
      />
      {uploading && <p className="mt-2 text-sm text-gray-600">Uploading...</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
