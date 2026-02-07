'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface LayoutProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'student'
}

export default function Layout({ children, requiredRole }: LayoutProps) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      // Use setTimeout to defer navigation after render
      const timer = setTimeout(() => {
        router.push('/auth/login')
      }, 0)
      return () => clearTimeout(timer)
    } else if (!loading && user && requiredRole && profile?.role !== requiredRole) {
      // Use setTimeout to defer navigation after render
      const timer = setTimeout(() => {
        router.push('/')
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [user, profile, loading, requiredRole, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">📚 Quiz App</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{profile?.email}</span>
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                {profile?.role}
              </span>
              <button
                onClick={() => signOut().then(() => router.push('/auth/login'))}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  )
}
