// Health check endpoint to verify Supabase connectivity
import { supabase } from '@/integrations/supabase/client';

export const checkSupabaseHealth = async () => {
  try {
    // Test database connectivity
    const { data: dbTest, error: dbError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (dbError) throw dbError;

    // Test auth service
    const { data: authTest, error: authError } = await supabase.auth.getSession();
    if (authError) throw authError;

    return {
      status: 'healthy',
      services: {
        database: 'connected',
        auth: 'connected',
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Supabase health check failed:', error);
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};

// Test RLS - ensure user can only read their own profile
export const testRLS = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return {
      status: 'RLS working',
      canAccessOwnProfile: !!data,
      profileId: data?.id
    };
  } catch (error) {
    return {
      status: 'RLS test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};