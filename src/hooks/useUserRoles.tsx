
import { useState, useEffect } from 'react';
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

  const hasRole = (role: AppRole): boolean => {
    return userRoles?.some(ur => ur.role === role) || false;
  };

  const isAdmin = (): boolean => hasRole('admin');
  const isSystemOwner = (): boolean => hasRole('system_owner');
  const isSupervisor = (): boolean => hasRole('supervisor');
  const isPartsApprover = (): boolean => hasRole('parts_approver');
  const isJobAllocator = (): boolean => hasRole('job_allocator');
  const isBatchManager = (): boolean => hasRole('batch_manager');

  // System owners and admins can manage the system
  const canManageSystem = (): boolean => isAdmin() || isSystemOwner();

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
    },
  });

  return {
    userRoles,
    isLoading,
    hasRole,
    isAdmin,
    isSystemOwner,
    isSupervisor,
    isPartsApprover,
    isJobAllocator,
    isBatchManager,
    canManageSystem,
    assignRole: assignRoleMutation.mutate,
    removeRole: removeRoleMutation.mutate,
    isAssigningRole: assignRoleMutation.isPending,
    isRemovingRole: removeRoleMutation.isPending,
  };
};
