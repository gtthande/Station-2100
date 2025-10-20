import { createBrowserClient } from "@supabase/ssr";
import type { Database } from './types';

// Main Supabase client for browser/client-side usage
export const supabase = createBrowserClient<Database>(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);