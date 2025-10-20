import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type CustomerPermissionType = 'view_basic' | 'view_contact' | 'view_full' | 'manage';

export interface CustomerPermission {
  id: string;
  user_id: string;
  permission_type: CustomerPermissionType;
  granted_by: string;
  granted_at: string;
  expires_at?: string;
  notes?: string;
  created_at: string;
}

export const useCustomerPermissions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user's customer permissions
  const { data: userPermissions, isLoading } = useQuery({
    queryKey: ['customer-permissions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('customer_permissions')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as CustomerPermission[];
    },
    enabled: !!user,
  });

  // Get all customer permissions (admin only)
  const { data: allPermissions } = useQuery({
    queryKey: ['all-customer-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_permissions')
        .select(`
          *,
          profiles!customer_permissions_user_id_fkey(full_name, email)
        `);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Check if user has specific permission
  const hasPermission = (permission: CustomerPermissionType): boolean => {
    if (!userPermissions) return false;
    return userPermissions.some(p => p.permission_type === permission && 
      (!p.expires_at || new Date(p.expires_at) > new Date()));
  };

  // Check if user can view customer data
  const canViewCustomers = (): boolean => 
    hasPermission('view_basic') || hasPermission('view_contact') || 
    hasPermission('view_full') || hasPermission('manage');

  // Check if user can view contact info
  const canViewContactInfo = (): boolean => 
    hasPermission('view_contact') || hasPermission('view_full') || hasPermission('manage');

  // Check if user can view full customer details
  const canViewFullDetails = (): boolean => 
    hasPermission('view_full') || hasPermission('manage');

  // Check if user can manage customers
  const canManageCustomers = (): boolean => hasPermission('manage');

  // Grant permission to user
  const grantPermissionMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      permission, 
      expiresAt, 
      notes 
    }: { 
      userId: string; 
      permission: CustomerPermissionType; 
      expiresAt?: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('customer_permissions')
        .insert({
          user_id: userId,
          permission_type: permission,
          granted_by: user?.id!,
          expires_at: expiresAt,
          notes
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['all-customer-permissions'] });
      toast({
        title: "Permission granted",
        description: "Customer permission has been granted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error granting permission",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Revoke permission from user
  const revokePermissionMutation = useMutation({
    mutationFn: async ({ userId, permission }: { userId: string; permission: CustomerPermissionType }) => {
      const { error } = await supabase
        .from('customer_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('permission_type', permission);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['all-customer-permissions'] });
      toast({
        title: "Permission revoked",
        description: "Customer permission has been revoked successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error revoking permission",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    userPermissions,
    allPermissions,
    isLoading,
    hasPermission,
    canViewCustomers,
    canViewContactInfo,
    canViewFullDetails,
    canManageCustomers,
    grantPermission: grantPermissionMutation.mutate,
    revokePermission: revokePermissionMutation.mutate,
    isGrantingPermission: grantPermissionMutation.isPending,
    isRevokingPermission: revokePermissionMutation.isPending,
  };
};