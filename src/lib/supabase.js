import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL      || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Standard client — used throughout the app with the anon key + user JWTs
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client — used ONLY in AdminDashboard to create system user auth accounts.
// This requires the service role key which bypasses RLS.
// ⚠️  TODO before production: move admin user creation to a Supabase Edge Function
//      so the service role key is never exposed in the client bundle.
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''

export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null

export default supabase