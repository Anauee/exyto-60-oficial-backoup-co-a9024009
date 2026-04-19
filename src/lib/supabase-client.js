import { createClient } from '@supabase/supabase-js'

const getEnvVar = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key]
  }
  return typeof process !== 'undefined' ? process.env[key] : undefined
}

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL')
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERRO: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configurados.");
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
)