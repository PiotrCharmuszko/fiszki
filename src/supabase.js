import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ptcnimrnffdxknoytdjj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0Y25pbXJuZmZkeGtub3l0ZGpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTgzNDMsImV4cCI6MjA4NTczNDM0M30.Aj8AF1cL3r5XWZ40zw9SU7UeLuDfTRIWvQjptDLckHQ'

if (!supabaseUrl || !supabaseKey) {
  console.error('Brak Supabase URL lub klucza! Dodaj je w pliku supabase.js')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

if (import.meta.env.DEV) {
  console.log('✅ Supabase skonfigurowany:', supabaseUrl)
}