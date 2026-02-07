export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      questions: {
        Row: {
          id: string
          class: number
          subject: string
          chapter: string | null
          topic: string | null
          subtopic: string | null
          question_text: string | null
          question_image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class: number
          subject: string
          chapter?: string | null
          topic?: string | null
          subtopic?: string | null
          question_text?: string | null
          question_image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class?: number
          subject?: string
          chapter?: string | null
          topic?: string | null
          subtopic?: string | null
          question_text?: string | null
          question_image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      question_options: {
        Row: {
          id: string
          question_id: string
          option_text: string | null
          option_image_url: string | null
          is_correct: boolean
          option_order: number
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          option_text?: string | null
          option_image_url?: string | null
          is_correct: boolean
          option_order: number
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          option_text?: string | null
          option_image_url?: string | null
          is_correct?: boolean
          option_order?: number
          created_at?: string
        }
      }
      attempts: {
        Row: {
          id: string
          user_id: string
          class: number
          subject: string
          scope_type: 'chapter' | 'topic'
          scope_value: string
          question_count: number
          score: number | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          class: number
          subject: string
          scope_type: 'chapter' | 'topic'
          scope_value: string
          question_count: number
          score?: number | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          class?: number
          subject?: string
          scope_type?: 'chapter' | 'topic'
          scope_value?: string
          question_count?: number
          score?: number | null
          completed_at?: string | null
          created_at?: string
        }
      }
      attempt_answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          selected_option_id: string
          time_taken_seconds: number
          created_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          selected_option_id: string
          time_taken_seconds: number
          created_at?: string
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          selected_option_id?: string
          time_taken_seconds?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Question = Database['public']['Tables']['questions']['Row']
export type QuestionInsert = Database['public']['Tables']['questions']['Insert']
export type QuestionOption = Database['public']['Tables']['question_options']['Row']
export type QuestionOptionInsert = Database['public']['Tables']['question_options']['Insert']
export type Attempt = Database['public']['Tables']['attempts']['Row']
export type AttemptInsert = Database['public']['Tables']['attempts']['Insert']
export type AttemptAnswer = Database['public']['Tables']['attempt_answers']['Row']
export type AttemptAnswerInsert = Database['public']['Tables']['attempt_answers']['Insert']

export type QuestionWithOptions = Question & {
  options: QuestionOption[]
}

export type UserRole = 'admin' | 'student'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
}
