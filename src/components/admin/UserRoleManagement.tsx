
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRoles } from '@/hooks/useUserRoles';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, UserMinus, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AppRole = 'admin' | 'parts_approver' | 'job_allocator' | 'batch_manager';

const roleLabels: Record<AppRole, string> = {
  admin: 'Administrator',
  parts_approver: 'Parts Approver',
  job_allocator: 'Job Allocator',
  batch_manager: 'Batch Manager'
};

const roleColors: Record<AppRole, string> = {
  admin: 'bg-red-500/20 text-red-300 border-red-500/30',
  parts_approver: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  job_allocator: 'bg-green-500/20 text-green-300 border-green-500/30',
  batch_manager: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
};

export const UserRoleManagement = () => {
  const { isAdmin, assignRole, removeRole, isAssigningRole, isRemovingRole } = useUserRoles();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<AppRole>('batch_manager');
  const [emailFilter, setEmailFilter] = useState('');

  const { data: allUserRoles, isLoading } = useQuery({
    queryKey: ['all-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles_view')
        .select('*')
        .order('email');
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin(),
  });

  const { data: profiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('email');
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin(),
  });

  const filteredUserRoles = allUserRoles?.filter(role =>
    role.email?.toLowerCase().includes(emailFilter.toLowerCase()) ||
    role.full_name?.toLowerCase().includes(emailFilter.toLowerCase())
  ) || [];

  const handleAssignRole = (userId: string, role: AppRole) => {
    assignRole({ userId, role }, {
      onSuccess: () => {
        toast({
          title: "Role Assigned",
          description: `Successfully assigned ${roleLabels[role]} role`,
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleRemoveRole = (userId: string, role: AppRole) => {
    removeRole({ userId, role }, {
      onSuccess: () => {
        toast({
          title: "Role Removed",
          description: `Successfully removed ${roleLabels[role]} role`,
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  if (!isAdmin()) {
    return (
      <GlassCard>
        <GlassCardContent className="p-8 text-center">
          <Shield className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
          <p className="text-white/60">You need administrator privileges to manage user roles.</p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  if (isLoading) {
    return (
      <GlassCard>
        <GlassCardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading user roles...</p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  // Group users by email/profile
  const userGroups = profiles?.map(profile => {
    const userRoles = allUserRoles?.filter(role => role.user_id === profile.id) || [];
    return {
      ...profile,
      roles: userRoles
    };
  }) || [];

  return (
    <div className="space-y-6">
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Role Management
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search users by email or name..."
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              className="flex-1 bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="grid gap-4">
            {userGroups.map((user) => (
              <div key={user.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-white">{user.full_name || user.email}</h4>
                    <p className="text-sm text-white/60">{user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
                      <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-surface-dark border-white/20">
                        {Object.entries(roleLabels).map(([role, label]) => (
                          <SelectItem key={role} value={role} className="text-white">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={() => handleAssignRole(user.id, selectedRole)}
                      disabled={isAssigningRole || user.roles.some(r => r.role === selectedRole)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((userRole) => (
                    <div key={userRole.id} className="flex items-center gap-1">
                      <Badge className={`${roleColors[userRole.role as AppRole]} border`}>
                        {roleLabels[userRole.role as AppRole]}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveRole(user.id, userRole.role as AppRole)}
                        disabled={isRemovingRole}
                        className="h-6 w-6 p-0 border-red-500/30 hover:bg-red-500/20"
                      >
                        <UserMinus className="w-3 h-3 text-red-400" />
                      </Button>
                    </div>
                  ))}
                  {user.roles.length === 0 && (
                    <span className="text-white/40 text-sm">No roles assigned</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
};
