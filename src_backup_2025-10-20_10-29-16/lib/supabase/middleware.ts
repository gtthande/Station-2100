import { createServerClient } from "@supabase/ssr";
import type { Database } from '@/integrations/supabase/types';

// For middleware scenarios (like Express middleware, Vite middleware, etc.)
export function createMiddlewareSupabaseClient(request: Request) {
  return createServerClient<Database>(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Extract cookies from the request
          const cookieHeader = request.headers.get('cookie');
          if (!cookieHeader) return [];
          
          return cookieHeader.split(';').map(cookie => {
            const [name, value] = cookie.trim().split('=');
            return { name, value };
          });
        },
        setAll(cookiesToSet) {
          // In middleware, you typically can't set cookies directly
          // The response would need to be handled by the framework
          cookiesToSet.forEach(({ name, value, options }) => {
            console.log(`Middleware would set cookie: ${name}=${value}`, options);
          });
        },
      },
    }
  );
}
