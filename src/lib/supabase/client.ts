import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://aswlxydrohyayweuhohp.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzd2x4eWRyb2h5YXl3ZXVob2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4Mzk2MjksImV4cCI6MjEwMzQxNTYyOX0.BXT23ax2SAj-Sa-bD-kajNIxXkNb_Z13gRiHqXuXsfg';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
