import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://pwnpskdkoefrqmowwbgo.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bnBza2Rrb2VmcnFtb3d3YmdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODc5OTcsImV4cCI6MjEwNTY2Mzk5N30.K90IiO8gC9KmRwkIZRqy8XfDn15zJGFDIh8rzIYXB78';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabaseClient: SupabaseClient | null = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseClientConfigured = !!supabaseClient;
export const SUPABASE_PROJECT_REF = 'pwnpskdkoefrqmowwbgo';
export const SUPABASE_PROJECT_URL = supabaseUrl;
