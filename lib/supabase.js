import { createClient } from "@supabase/supabase-js";

// ⚙️ Get values from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create the Supabase client (singleton)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ✅ Auth helpers
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// ✅ Database helpers
export const insertData = async (table, record) => {
  const { data, error } = await supabase.from(table).insert(record);
  if (error) throw error;
  return data;
};

export const getData = async (table, filters = {}) => {
  let query = supabase.from(table).select("*");
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// ✅ Storage helpers
export const uploadFile = async (bucket, path, file) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;
  return data;
};

export const getPublicUrl = (bucket, path) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};
