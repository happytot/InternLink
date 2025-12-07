'use server';

import { createClient } from '@supabase/supabase-js';

export async function deleteUserAsAdmin(userId) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY;

  // 1. Sanity Check: Are the keys loaded?
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Environment Variables for Admin Client');
    return { success: false, error: 'Server configuration error: Missing Service Role Key.' };
  }

  // 2. Create the Admin Client with the Service Role Key
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 3. Attempt Delete
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    console.error('❌ Delete failed:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}