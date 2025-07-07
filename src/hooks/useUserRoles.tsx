
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';

type UserRole = Tables<'user_roles'>;
type AppRole = 'admin' | 'system_owner' | 'supervisor' | 'parts_approver' | 'job_allocator' | 'batch_manager';

export const useUserRoles = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userRoles, isLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as UserRole[];
    },
    enabled: !!user,
  });

  // Get all user roles including custom ones
  const { data: allUserRoles } = useQuery({
    queryKey: ['user-roles-combined', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Try to get combined roles with custom roles
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          custom_roles (
            name,
            label,
            description
          )
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const hasRole = (role: AppRole): boolean => {
    return userRoles?.some(ur => ur.role === role) || false;
  };

  const hasCustomRole = (roleName: string): boolean => {
    return allUserRoles?.some(ur => 
      ur.custom_roles && typeof ur.custom_roles === 'object' && 
      'name' in ur.custom_roles && ur.custom_roles.name === roleName
    ) || false;
  };

  const isAdmin = (): boolean => hasRole('admin');
  const isSystemOwner = (): boolean => hasRole('system_owner');
  const isSupervisor = (): boolean => hasRole('supervisor');
  const isPartsApprover = (): boolean => hasRole('parts_approver');
  const isJobAllocator = (): boolean => hasRole('job_allocator');
  const isBatchManager = (): boolean => hasRole('batch_manager');

  // System owners and admins can manage the system
  const canManageSystem = (): boolean => isAdmin() || isSystemOwner();

  // Feature access functions based on roles
  const canViewReports = (): boolean => 
    canManageSystem() || hasCustomRole('view_reports');
  
  const canManageCustomers = (): boolean => 
    canManageSystem() || hasCustomRole('manage_customers');
  
  const canManageSuppliers = (): boolean => 
    canManageSystem() || hasCustomRole('manage_suppliers');
  
  const canViewAnalytics = (): boolean => 
    canManageSystem() || hasCustomRole('view_analytics');

  // Generic function to check any custom role
  const hasAnyRole = (roleNames: string[]): boolean => {
    return roleNames.some(roleName => 
      hasCustomRole(roleName) || 
      (Object.values(['admin', 'system_owner', 'supervisor', 'parts_approver', 'job_allocator', 'batch_manager']).includes(roleName as any) && hasRole(roleName as AppRole))
    );
  };

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: role as any });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles-combined'] });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as any);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-roles-combined'] });
    },
  });

  return {
    userRoles,
    allUserRoles,
    isLoading,
    hasRole,
    hasCustomRole,
    hasAnyRole,
    isAdmin,
    isSystemOwner,
    isSupervisor,
    isPartsApprover,
    isJobAllocator,
    isBatchManager,
    canManageSystem,
    canViewReports,
    canManageCustomers,
    canManageSuppliers,
    canViewAnalytics,
    assignRole: assignRoleMutation.mutate,
    removeRole: removeRoleMutation.mutate,
    isAssigningRole: assignRoleMutation.isPending,
    isRemovingRole: removeRoleMutation.isPending,
  };
};
