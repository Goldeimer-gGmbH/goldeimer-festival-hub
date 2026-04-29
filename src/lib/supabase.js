import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wsdkmglkqxszyvomrfim.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZGttZ2xrcXhzenl2b21yZmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTk4NjYsImV4cCI6MjA5MTczNTg2Nn0.CkX010BgVGjJUOs7RSYHlXJSwA-0jL4iPvi4gA59dTM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    // PWA nutzt keine URL-basierte Auth — unnötigen URL-Scan bei jedem Reload vermeiden
    detectSessionInUrl: false,
  },
})
