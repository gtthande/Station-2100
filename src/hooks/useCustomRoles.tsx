
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRoles } from '@/hooks/useUserRoles';

export const useCustomRoles = () => {
  const { canManageSystem } = useUserRoles();
  const queryClient = useQueryClient();

  const { data: customRoles, isLoading } = useQuery({
    queryKey: ['custom-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .order('label');
      
      if (error) throw error;
      return data;
    },
    enabled: canManageSystem(),
  });

  const assignCustomRoleMutation = useMutation({
    mutationFn: async ({ userId, customRoleId }: { userId: string; customRoleId: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, custom_role_id: customRoleId });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles-combined'] });
    },
  });

  const removeCustomRoleMutation = useMutation({
    mutationFn: async ({ userId, customRoleId }: { userId: string; customRoleId: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('custom_role_id', customRoleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles-combined'] });
    },
  });

  return {
    customRoles,
    isLoading,
    assignCustomRole: assignCustomRoleMutation.mutate,
    removeCustomRole: removeCustomRoleMutation.mutate,
    isAssigningCustomRole: assignCustomRoleMutation.isPending,
    isRemovingCustomRole: removeCustomRoleMutation.isPending,
  };
};
