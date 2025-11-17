// lib/supabaseAdmin.js
import { createClient } from '@supabase/supabase-js';

// These come from your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Supabase admin credentials not found. Make sure SUPABASE_SERVICE_KEY is set in .env.local");
}

// Create the admin client
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});