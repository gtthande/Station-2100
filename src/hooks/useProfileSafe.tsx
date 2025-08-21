import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SafeProfile {
  id: string;
  full_name: string;
  profile_image_url?: string;
  position?: string;
  department_id?: string;
  is_staff: boolean;
  staff_active: boolean;
  created_at: string;
}

export const useProfileSafe = () => {
  const { user } = useAuth();

  const { data: profiles = [], isLoading, error } = useQuery({
    queryKey: ['profiles-safe'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles_safe')
        .select('*');
      
      if (error) throw error;
      return data as SafeProfile[];
    },
    enabled: !!user,
  });

  const { data: currentUserProfile } = useQuery({
    queryKey: ['current-user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles_safe')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data as SafeProfile;
    },
    enabled: !!user?.id,
  });

  return {
    profiles,
    currentUserProfile,
    isLoading,
    error
  };
};