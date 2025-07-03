
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRoles } from '@/hooks/useUserRoles';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, UserPlus, UserMinus, Shield, Settings, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AppRole = 'admin' | 'supervisor' | 'parts_approver' | 'job_allocator' | 'batch_manager';

const roleLabels: Record<AppRole, string> = {
  admin: 'Administrator',
  supervisor: 'Supervisor',
  parts_approver: 'Parts Approver', 
  job_allocator: 'Job Allocator',
  batch_manager: 'Batch Manager'
};

const roleDescriptions: Record<AppRole, string> = {
  admin: 'Full system access and user management',
  supervisor: 'Can approve batches and manage warehouse operations',
  parts_approver: 'Can approve pending inventory batches',
  job_allocator: 'Can allocate approved batches to warehouse locations',
  batch_manager: 'Can create and submit inventory batches'
};

const roleColors: Record<AppRole, string> = {
  admin: 'bg-red-500/20 text-red-300 border-red-500/30',
  supervisor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  parts_approver: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  job_allocator: 'bg-green-500/20 text-green-300 border-green-500/30',
  batch_manager: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
};

export const UserManagement = () => {
  const { isAdmin, assignRole, removeRole, isAssigningRole, isRemovingRole } = useUserRoles();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<AppRole>('batch_manager');
  const [emailFilter, setEmailFilter] = useState('');
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'batch_manager' as AppRole
  });

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

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUserData) => {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: {
          full_name: userData.full_name
        },
        email_confirm: true // Auto-confirm email for admin-created users
      });

      if (authError) throw authError;

      // Assign role to the new user
      if (authData.user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: userData.role
          });

        if (roleError) throw roleError;
      }

      return authData.user;
    },
    onSuccess: () => {
      toast({
        title: "User Created",
        description: "User account created and role assigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
      setIsCreateUserOpen(false);
      setNewUserData({
        email: '',
        password: '',
        full_name: '',
        role: 'batch_manager'
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

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserData.email || !newUserData.password) {
      toast({
        title: "Error",
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate(newUserData);
  };

  if (!isAdmin()) {
    return (
      <GlassCard>
        <GlassCardContent className="p-8 text-center">
          <Shield className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
          <p className="text-white/60">You need administrator privileges to manage users.</p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  if (isLoading) {
    return (
      <GlassCard>
        <GlassCardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading user management...</p>
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
          <div className="flex items-center justify-between">
            <GlassCardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management & Role Assignment
            </GlassCardTitle>
            <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-surface-dark border-white/20 text-white">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={newUserData.full_name}
                      onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Initial Role</Label>
                    <Select 
                      value={newUserData.role} 
                      onValueChange={(value) => setNewUserData({ ...newUserData, role: value as AppRole })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-surface-dark border-white/20">
                        {Object.entries(roleLabels).map(([role, label]) => (
                          <SelectItem key={role} value={role} className="text-white">
                            <div>
                              <div className="font-medium">{label}</div>
                              <div className="text-xs text-white/60">{roleDescriptions[role as AppRole]}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateUserOpen(false)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createUserMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
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
            {userGroups.map((user) => (
              <div key={user.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-white">{user.full_name || user.email}</h4>
                    <p className="text-sm text-white/60">{user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
                      <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-surface-dark border-white/20">
                        {Object.entries(roleLabels).map(([role, label]) => (
                          <SelectItem key={role} value={role} className="text-white">
                            <div>
                              <div className="font-medium">{label}</div>
                              <div className="text-xs text-white/60">{roleDescriptions[role as AppRole]}</div>
                            </div>
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

      {/* Role Information Card */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Role Permissions Overview
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid gap-4">
            {Object.entries(roleLabels).map(([role, label]) => (
              <div key={role} className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Badge className={`${roleColors[role as AppRole]} border`}>
                    {label}
                  </Badge>
                </div>
                <p className="text-sm text-white/70">{roleDescriptions[role as AppRole]}</p>
              </div>
            ))}
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
};
