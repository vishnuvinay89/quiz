import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user role from metadata or profile
  const role = user.user_metadata?.role || 'student'

  if (role === 'admin') {
    redirect('/admin/dashboard')
  } else {
    redirect('/student/dashboard')
  }
}
