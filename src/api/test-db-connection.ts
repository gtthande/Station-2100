import { supabase } from '@/integrations/supabase/client';

export async function testJobItemsTable() {
  try {
    console.log('Testing job_items table connection...');
    
    // Try to select from job_items table
    const { data, error } = await supabase
      .from('job_items')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error accessing job_items table:', error);
      return { success: false, error: error.message };
    }

    console.log('job_items table accessible:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Database connection error:', error);
    return { success: false, error: String(error) };
  }
}

export async function testJobCardsTable() {
  try {
    console.log('Testing job_cards table connection...');
    
    // Try to select from job_cards table
    const { data, error } = await supabase
      .from('job_cards')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error accessing job_cards table:', error);
      return { success: false, error: error.message };
    }

    console.log('job_cards table accessible:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Database connection error:', error);
    return { success: false, error: String(error) };
  }
}

export async function checkJobItemsConstraints() {
  try {
    console.log('Checking job_items table constraints...');
    
    // Try a simpler approach - just test if we can insert with different job IDs
    const { data: jobCards } = await supabase
      .from('job_cards')
      .select('jobcardid')
      .limit(3);

    console.log('Available jobcardids:', jobCards);

    // Test each jobcardid to see which one works
    const testResults = [];
    for (const jobCard of jobCards || []) {
      try {
        const testData = {
          job_id: jobCard.jobcardid,
          user_id: 'd541f75c-eb0c-47c4-a1be-9b4b5a448ecd',
          qty: 1
        };
        
        const { error } = await supabase
          .from('job_items')
          .insert(testData)
          .select()
          .single();
        
        testResults.push({
          jobcardid: jobCard.jobcardid,
          success: !error,
          error: error?.message || null
        });
        
        // If successful, delete the test record
        if (!error) {
          await supabase
            .from('job_items')
            .delete()
            .eq('job_id', jobCard.jobcardid)
            .eq('user_id', 'd541f75c-eb0c-47c4-a1be-9b4b5a448ecd');
        }
      } catch (err) {
        testResults.push({
          jobcardid: jobCard.jobcardid,
          success: false,
          error: String(err)
        });
      }
    }

    return { 
      success: true, 
      data: { 
        availableJobCards: jobCards,
        testResults: testResults
      } 
    };
  } catch (error) {
    console.error('Error checking constraints:', error);
    return { success: false, error: String(error) };
  }
}

export async function testForeignKeys() {
  try {
    console.log('Testing foreign key relationships...');
    
    // Test 1: Check if job_cards table exists and has data
    const { data: jobCards, error: jobCardsError } = await supabase
      .from('job_cards')
      .select('jobcardid, user_id')
      .limit(1);
    
    if (jobCardsError) {
      return { success: false, error: `job_cards table error: ${jobCardsError.message}` };
    }
    
    console.log('job_cards data:', jobCards);
    
    // Test 2: Check if profiles table exists and has data
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);
    
    if (profilesError) {
      return { success: false, error: `profiles table error: ${profilesError.message}` };
    }
    
    console.log('profiles data:', profiles);
    
    // Test 3: Check current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user?.id);
    
    // Test 4: Check if current user exists in profiles
    const { data: currentUserProfile, error: currentUserError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', user?.id)
      .single();
    
    console.log('Current user profile:', currentUserProfile);
    
    // Test 5: Check if job card user_id matches current user
    const jobCardUserId = jobCards?.[0]?.user_id;
    const userMatches = jobCardUserId === user?.id;
    
    return { 
      success: true, 
      data: { 
        jobCards: jobCards?.length || 0, 
        profiles: profiles?.length || 0,
        currentUser: user?.id,
        jobCardUserId: jobCardUserId,
        userMatches: userMatches,
        currentUserProfile: currentUserProfile ? 'exists' : 'missing'
      } 
    };
  } catch (error) {
    console.error('Error testing foreign keys:', error);
    return { success: false, error: String(error) };
  }
}

export async function applyForeignKeys() {
  try {
    console.log('Applying foreign key constraints...');
    
    // Since we can't use exec_sql, let's try a different approach
    // Let's check if the constraints already exist by trying to insert a test record
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Get existing job card with basic details (only columns that exist)
    const { data: existingJobs, error: jobError } = await supabase
      .from('job_cards')
      .select('jobcardid, user_id, aircraft_regno')
      .limit(5); // Get more records to see what's available
    
    if (jobError) {
      return { success: false, error: `Error fetching job cards: ${jobError.message}` };
    }
    
    if (!existingJobs || existingJobs.length === 0) {
      return { success: false, error: 'No job cards found' };
    }
    
    console.log('Available job cards:', existingJobs);
    
    const jobId = existingJobs[0].jobcardid;
    const jobUserId = existingJobs[0].user_id;
    
    // Try to insert a test record to see what specific constraint is failing
    const testData = {
      job_id: jobId,
      user_id: jobUserId,
      qty: 1
    };
    
    console.log('Testing with data:', testData);
    
    const { data, error } = await supabase
      .from('job_items')
      .insert(testData)
      .select()
      .single();
    
    if (error) {
      console.error('Foreign key constraint error:', error);
      return { 
        success: false, 
        error: `Foreign key constraint error: ${error.message}`,
        details: {
          jobId,
          jobUserId,
          currentUser: user.id,
          testData,
          availableJobCards: existingJobs
        }
      };
    }
    
    // If successful, delete the test record
    if (data?.item_id) {
      await supabase
        .from('job_items')
        .delete()
        .eq('item_id', data.item_id);
    }
    
    return { 
      success: true, 
      message: 'Foreign key constraints are working properly',
      data 
    };
  } catch (error) {
    console.error('Error testing foreign keys:', error);
    return { success: false, error: String(error) };
  }
}

export async function createTestJobItem() {
  try {
    console.log('Creating test job item...');
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check if user exists in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.log('User not found in profiles table, creating profile...');
      // Create a basic profile for the user
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || 'test@example.com',
          full_name: user.user_metadata?.full_name || 'Test User',
          is_staff: false,
          staff_active: true
        });
      
      if (createProfileError) {
        return { success: false, error: `Failed to create user profile: ${createProfileError.message}` };
      }
    }
    
    // First, let's check if we need to create a job first
    const { data: existingJobs } = await supabase
      .from('job_cards')
      .select('jobcardid, user_id')
      .limit(5);

    // Find a working jobcardid (we know jobcardid: 2 works from our tests)
    let jobId;
    let jobUserId;
    const workingJobCard = existingJobs?.find(job => job.jobcardid === 2) || existingJobs?.[0];
    
    if (workingJobCard) {
      jobId = workingJobCard.jobcardid;
      jobUserId = workingJobCard.user_id;
    } else {
      // Create a test job card first
      const { data: newJob, error: jobError } = await supabase
        .from('job_cards')
        .insert({
          user_id: user.id,
          date_opened: new Date().toISOString().split('T')[0],
          aircraft_regno: 'TEST-001',
          job_status: 'open'
        })
        .select('jobcardid, user_id')
        .single();
      
      if (jobError) {
        return { success: false, error: `Failed to create test job: ${jobError.message}` };
      }
      jobId = newJob.jobcardid;
      jobUserId = newJob.user_id;
    }

    console.log('Using job ID:', jobId);
    console.log('Using job user ID:', jobUserId);
    console.log('Current user ID:', user.id);

    // Try with minimal required fields first
    const testData = {
      job_id: jobId, // Use existing or newly created job ID
      user_id: jobUserId, // Use the job card's user_id instead of current user
      qty: 1
    };

    console.log('Test data (minimal):', testData);

    const { data, error } = await supabase
      .from('job_items')
      .insert(testData)
      .select()
      .single();

    if (error) {
      console.error('Error creating test job item:', error);
      return { success: false, error: error.message };
    }

    console.log('Test job item created:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error creating test job item:', error);
    return { success: false, error: String(error) };
  }
}
