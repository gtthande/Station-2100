import { supabase } from '@/integrations/supabase/client';

export async function fixJobItemsRLS() {
  try {
    console.log('Fixing job_items RLS policies...');
    
    // Drop existing policies
    await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Users can view their own job items" ON public.job_items;
        DROP POLICY IF EXISTS "Users can insert their own job items" ON public.job_items;
        DROP POLICY IF EXISTS "Users can update their own job items" ON public.job_items;
        DROP POLICY IF EXISTS "Users can delete their own job items" ON public.job_items;
      `
    });

    // Create new policies
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow authenticated users to view job items" 
          ON public.job_items 
          FOR SELECT 
          USING (auth.role() = 'authenticated');
      `
    });

    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow authenticated users to insert job items" 
          ON public.job_items 
          FOR INSERT 
          WITH CHECK (auth.role() = 'authenticated');
      `
    });

    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow authenticated users to update job items" 
          ON public.job_items 
          FOR UPDATE 
          USING (auth.role() = 'authenticated');
      `
    });

    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow authenticated users to delete job items" 
          ON public.job_items 
          FOR DELETE 
          USING (auth.role() = 'authenticated');
      `
    });

    console.log('RLS policies fixed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error fixing RLS policies:', error);
    return { success: false, error: String(error) };
  }
}







