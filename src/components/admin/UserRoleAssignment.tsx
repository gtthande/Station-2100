
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useCustomRoles } from '@/hooks/useCustomRoles';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Search, UserCheck, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AppRole = 'admin' | 'system_owner' | 'supervisor' | 'parts_approver' | 'job_allocator' | 'batch_manager';

const systemRoleLabels: Record<AppRole, string> = {
  admin: 'System Administrator',
  system_owner: 'System Owner',
  supervisor: 'Supervisor',
  parts_approver: 'Parts Batch Approver', 
  job_allocator: 'Parts Issue Approver',
  batch_manager: 'Job Closer'
};

const systemRoleColors: Record<AppRole, string> = {
  admin: 'bg-red-500/20 text-red-300 border-red-500/30',
  system_owner: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  supervisor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  parts_approver: 'bg-green-500/20 text-green-300 border-green-500/30',
  job_allocator: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  batch_manager: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
};

export const UserRoleAssignment = () => {
  const { canManageSystem, assignRole, removeRole, isAssigningRole, isRemovingRole } = useUserRoles();
  const { customRoles, assignCustomRole, removeCustomRole, isAssigningCustomRole, isRemovingCustomRole } = useCustomRoles();
  const { toast } = useToast();
  const [emailFilter, setEmailFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);

  const { data: allUserRoles } = useQuery({
    queryKey: ['user-roles-combined'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles_combined_view')
        .select('*')
        .order('email');
      
      if (error) throw error;
      return data;
    },
    enabled: canManageSystem(),
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
    enabled: canManageSystem(),
  });

  const filteredProfiles = profiles?.filter(profile =>
    profile.email?.toLowerCase().includes(emailFilter.toLowerCase()) ||
    profile.full_name?.toLowerCase().includes(emailFilter.toLowerCase())
  ) || [];

  const getUserRoles = (userId: string) => {
    return allUserRoles?.filter(role => role.user_id === userId) || [];
  };

  const hasSystemRole = (userId: string, role: AppRole) => {
    return getUserRoles(userId).some(r => r.role_name === role && r.is_system_role);
  };

  const hasCustomRole = (userId: string, customRoleId: string) => {
    return getUserRoles(userId).some(r => r.custom_role_id === customRoleId && !r.is_system_role);
  };

  const handleSystemRoleToggle = (userId: string, role: AppRole, isChecked: boolean) => {
    if (isChecked) {
      assignRole({ userId, role }, {
        onSuccess: () => {
          toast({
            title: "Role Assigned",
            description: `Successfully assigned ${systemRoleLabels[role]} role`,
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
    } else {
      removeRole({ userId, role }, {
        onSuccess: () => {
          toast({
            title: "Role Removed",
            description: `Successfully removed ${systemRoleLabels[role]} role`,
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
    }
  };

  const handleCustomRoleToggle = (userId: string, customRoleId: string, isChecked: boolean) => {
    if (isChecked) {
      assignCustomRole({ userId, customRoleId }, {
        onSuccess: () => {
          toast({
            title: "Custom Role Assigned",
            description: "Successfully assigned custom role",
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
    } else {
      removeCustomRole({ userId, customRoleId }, {
        onSuccess: () => {
          toast({
            title: "Custom Role Removed",
            description: "Successfully removed custom role",
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
    }
  };

  if (!canManageSystem()) {
    return null;
  }

  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Advanced Role Assignment
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
            <Input
              placeholder="Search users by email or name..."
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredProfiles.map((user) => {
            const userRoles = getUserRoles(user.id);
            
            return (
              <div key={user.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{user.full_name || user.email}</h4>
                    <p className="text-sm text-white/60">{user.email}</p>
                  </div>
                  <Dialog open={isRoleDialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                    setIsRoleDialogOpen(open);
                    if (!open) setSelectedUser(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Manage Roles
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-surface-dark border-white/20 text-white max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Manage Roles for {user.full_name || user.email}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* System Roles */}
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-3">System Roles</h3>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(systemRoleLabels).map(([role, label]) => (
                              <div key={role} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                                <Checkbox
                                  id={`${user.id}-${role}`}
                                  checked={hasSystemRole(user.id, role as AppRole)}
                                  onCheckedChange={(checked) => handleSystemRoleToggle(user.id, role as AppRole, checked as boolean)}
                                  disabled={isAssigningRole || isRemovingRole}
                                  className="border-white/30"
                                />
                                <label htmlFor={`${user.id}-${role}`} className="text-sm font-medium text-white cursor-pointer">
                                  {label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Custom Roles */}
                        {customRoles && customRoles.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-3">Custom Roles</h3>
                            <div className="grid grid-cols-2 gap-3">
                              {customRoles.map((customRole) => (
                                <div key={customRole.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                                  <Checkbox
                                    id={`${user.id}-${customRole.id}`}
                                    checked={hasCustomRole(user.id, customRole.id)}
                                    onCheckedChange={(checked) => handleCustomRoleToggle(user.id, customRole.id, checked as boolean)}
                                    disabled={isAssigningCustomRole || isRemovingCustomRole}
                                    className="border-white/30"
                                  />
                                  <div className="cursor-pointer" onClick={() => {
                                    const checkbox = document.getElementById(`${user.id}-${customRole.id}`) as HTMLInputElement;
                                    checkbox?.click();
                                  }}>
                                    <label htmlFor={`${user.id}-${customRole.id}`} className="text-sm font-medium text-white cursor-pointer">
                                      {customRole.label}
                                    </label>
                                    <p className="text-xs text-white/60">{customRole.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {/* Current Roles Display */}
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-white/80">Current Roles ({userRoles.length})</h5>
                  <div className="flex flex-wrap gap-2">
                    {userRoles.map((userRole) => (
                      <Badge 
                        key={userRole.id} 
                        className={
                          userRole.is_system_role 
                            ? systemRoleColors[userRole.role_name as AppRole] + ' border'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 border'
                        }
                      >
                        {userRole.role_label}
                      </Badge>
                    ))}
                    {userRoles.length === 0 && (
                      <span className="text-white/40 text-sm">No roles assigned</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
};
