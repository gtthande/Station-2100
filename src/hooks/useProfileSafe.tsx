import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SafeProfile {
  id: string;
  full_name: string;
  profile_image_url?: string;
  position?: string;
  department_id?: string;
  is_staff: boolean;
  staff_active: boolean;
  created_at: string;
  email: string; // Now conditionally protected
  phone?: string; // Now conditionally protected  
  badge_id?: string; // Now restricted to admins
}

export const useProfileSafe = () => {
  const { user } = useAuth();

  const { data: profiles = [], isLoading, error } = useQuery({
    queryKey: ['profiles-safe'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles_safe')
        .select('*');
      
      if (error) {
        console.error('Profile safe access error:', error);
        toast.error('Failed to load profile data securely');
        throw error;
      }
      return data as SafeProfile[];
    },
    enabled: !!user,
    retry: (failureCount, error) => {
      // Don't retry if it's a permission error
      if (error?.message?.includes('permission') || error?.message?.includes('access')) {
        return false;
      }
      return failureCount < 3;
    }
  });

  // Enhanced function to get secure profile data using the new database function
  const getSecureProfileData = async (profileId: string) => {
    if (!user) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase.rpc('get_safe_profile_data', {
      _profile_id: profileId
    });

    if (error) {
      console.error('Secure profile access error:', error);
      throw error;
    }

    return data;
  };

  const { data: currentUserProfile } = useQuery({
    queryKey: ['current-user-profile-safe', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles_safe')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle to handle no data gracefully
      
      if (error) {
        console.error('Current user profile access error:', error);
        throw error;
      }
      
      return data as SafeProfile | null;
    },
    enabled: !!user?.id,
  });

  // Emergency admin access function (only for critical situations)
  const emergencyAccess = async (profileId: string, justification: string) => {
    if (!user || justification.length < 10) {
      throw new Error('Emergency access requires detailed justification (minimum 10 characters)');
    }

    const { data, error } = await supabase.rpc('emergency_profile_access', {
      _profile_id: profileId,
      _justification: justification
    });

    if (error) {
      console.error('Emergency access error:', error);
      throw error;
    }

    toast.warning('Emergency access granted - This action has been logged for security review');
    return data;
  };

  return {
    profiles,
    currentUserProfile,
    isLoading,
    error,
    emergencyAccess,
    getSecureProfileData,
    // Helper functions to check data protection status
    isEmailProtected: (profile: SafeProfile) => profile.email === '[PROTECTED]',
    isPhoneProtected: (profile: SafeProfile) => profile.phone === '[PROTECTED]',
    isBadgeRestricted: (profile: SafeProfile) => profile.badge_id === '[RESTRICTED]'
  };
};