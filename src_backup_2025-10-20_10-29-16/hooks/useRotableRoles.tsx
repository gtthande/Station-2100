import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type RotableRole = 'admin' | 'technician' | 'storekeeper' | 'manager' | 'auditor';

export interface RotableUserRole {
  id: string;
  user_id: string;
  role: RotableRole;
  granted_by: string;
  granted_at: string;
}

export const useRotableRoles = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userRoles = [], isLoading } = useQuery({
    queryKey: ['rotable-user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('rotable_user_roles')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as RotableUserRole[];
    },
    enabled: !!user?.id,
  });

  const hasRotableRole = (role: RotableRole): boolean => {
    return userRoles?.some(ur => ur.role === role) || false;
  };

  const isRotableAdmin = (): boolean => hasRotableRole('admin');
  const isTechnician = (): boolean => hasRotableRole('technician');
  const isStorekeeper = (): boolean => hasRotableRole('storekeeper');
  const isManager = (): boolean => hasRotableRole('manager');
  const isAuditor = (): boolean => hasRotableRole('auditor');

  // Role-based permissions
  const canManageConfiguration = (): boolean => isRotableAdmin();
  const canLogActivities = (): boolean => isTechnician() || isRotableAdmin();
  const canManageInventory = (): boolean => isStorekeeper() || isRotableAdmin();
  const canAccessReports = (): boolean => isManager() || isAuditor() || isRotableAdmin();
  const canViewAuditLogs = (): boolean => isManager() || isAuditor() || isRotableAdmin();

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: RotableRole }) => {
      const { data, error } = await supabase
        .from('rotable_user_roles')
        .insert({
          user_id: userId,
          role,
          granted_by: user?.id || '',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotable-user-roles'] });
      toast.success('Role assigned successfully');
    },
    onError: (error) => {
      toast.error(`Failed to assign role: ${error.message}`);
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: RotableRole }) => {
      const { error } = await supabase
        .from('rotable_user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotable-user-roles'] });
      toast.success('Role removed successfully');
    },
    onError: (error) => {
      toast.error(`Failed to remove role: ${error.message}`);
    },
  });

  return {
    userRoles,
    isLoading,
    hasRotableRole,
    isRotableAdmin,
    isTechnician,
    isStorekeeper,
    isManager,
    isAuditor,
    canManageConfiguration,
    canLogActivities,
    canManageInventory,
    canAccessReports,
    canViewAuditLogs,
    assignRole: assignRoleMutation.mutate,
    removeRole: removeRoleMutation.mutate,
    isAssigningRole: assignRoleMutation.isPending,
    isRemovingRole: removeRoleMutation.isPending,
  };
};