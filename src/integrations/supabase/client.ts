import { createBrowserClient } from "@supabase/ssr";
import type { Database } from './types';

export const supabase = createBrowserClient<Database>(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);