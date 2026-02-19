import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export const getCurrentUser = async () => {
  const savedUser = localStorage.getItem('fiszki_user')
  return savedUser ? JSON.parse(savedUser) : null
}