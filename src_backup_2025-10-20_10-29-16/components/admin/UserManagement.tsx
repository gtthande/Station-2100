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
import { Users, UserPlus, UserMinus, Shield, Settings, Search, CheckCircle, Package, ClipboardCheck, Crown, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

type AppRole = 'admin' | 'system_owner' | 'supervisor' | 'parts_approver' | 'job_allocator' | 'batch_manager';

const roleLabels: Record<AppRole, string> = {
  admin: 'System Administrator',
  system_owner: 'System Owner',
  supervisor: 'Supervisor',
  parts_approver: 'Parts Batch Approver', 
  job_allocator: 'Parts Issue Approver',
  batch_manager: 'Job Closer'
};

const roleDescriptions: Record<AppRole, string> = {
  admin: 'Full system access and user management',
  system_owner: 'Business owner with full system access (no database access)',
  supervisor: 'Can supervise all warehouse operations and approve batches',
  parts_approver: 'Can approve parts batched into the system',
  job_allocator: 'Can approve parts issued out of the system',
  batch_manager: 'Can close completed jobs and manage final inventory'
};

const roleColors: Record<AppRole, string> = {
  admin: 'bg-red-500/20 text-red-300 border-red-500/30',
  system_owner: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  supervisor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  parts_approver: 'bg-green-500/20 text-green-300 border-green-500/30',
  job_allocator: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  batch_manager: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
};

const roleIcons: Record<AppRole, React.ReactNode> = {
  admin: <Shield className="w-4 h-4" />,
  system_owner: <Crown className="w-4 h-4" />,
  supervisor: <Users className="w-4 h-4" />,
  parts_approver: <CheckCircle className="w-4 h-4" />,
  job_allocator: <Package className="w-4 h-4" />,
  batch_manager: <ClipboardCheck className="w-4 h-4" />
};

// Main workflow roles that should be highlighted
const mainWorkflowRoles: AppRole[] = ['parts_approver', 'job_allocator', 'batch_manager'];

export const UserManagement = () => {
  const { canManageSystem, assignRole, removeRole, isAssigningRole, isRemovingRole } = useUserRoles();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [emailFilter, setEmailFilter] = useState('');
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [lastCreateTime, setLastCreateTime] = useState<number>(0);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'parts_approver' as AppRole
  });

  const { data: allUserRoles, isLoading } = useQuery({
    queryKey: ['all-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_user_roles_with_profiles');
      
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

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUserData) => {
      // Validate password complexity
      if (userData.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(userData.password)) {
        throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      }

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: {
          full_name: userData.full_name
        },
        email_confirm: false  // Require proper email verification
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: userData.role as any
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
        role: 'parts_approver'
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
    
    // Rate limiting: prevent creation more than once every 30 seconds
    const now = Date.now();
    if (now - lastCreateTime < 30000) {
      toast({
        title: "Error",
        description: "Please wait 30 seconds between user creations to prevent abuse",
        variant: "destructive",
      });
      return;
    }
    
    if (!newUserData.email || !newUserData.password) {
      toast({
        title: "Error",
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }

    // Additional client-side password validation
    if (newUserData.password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newUserData.password)) {
      toast({
        title: "Error", 
        description: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        variant: "destructive",
      });
      return;
    }

    setLastCreateTime(now);
    createUserMutation.mutate(newUserData);
  };

  if (!canManageSystem()) {
    return (
      <GlassCard>
        <GlassCardContent className="p-8 text-center">
          <Shield className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
          <p className="text-white/60">You need administrator or system owner privileges to manage users.</p>
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

  const userGroups = profiles?.map(profile => {
    const userRoles = allUserRoles?.filter(role => role.user_id === profile.id) || [];
    return {
      ...profile,
      roles: userRoles
    };
  }) || [];

  return (
    <div className="space-y-6">
      {/* Main Workflow Roles Overview */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Main Workflow Roles
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {mainWorkflowRoles.map((role) => (
              <div key={role} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${roleColors[role]}`}>
                    {roleIcons[role]}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{roleLabels[role]}</h4>
                  </div>
                </div>
                <p className="text-sm text-white/70">{roleDescriptions[role]}</p>
              </div>
            ))}
          </div>
          <div className="text-center text-white/60 text-sm">
            These are the three main roles for your workflow: approving parts batched in, approving parts issued out, and closing jobs.
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* User Management with Master-Detail */}
      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center justify-between">
            <GlassCardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Role Management
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
                      placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
                      required
                    />
                    <p className="text-xs text-white/60 mt-1">
                      Password must be at least 8 characters with uppercase, lowercase, and number
                    </p>
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
                            <div className="flex items-center gap-2">
                              {roleIcons[role as AppRole]}
                              <div>
                                <div className="font-medium">{label}</div>
                                <div className="text-xs text-white/60">{roleDescriptions[role as AppRole]}</div>
                              </div>
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

          <div className="grid gap-6">
            {userGroups.map((user) => {
              const availableRoles = Object.keys(roleLabels).filter(
                role => !user.roles.some(r => r.role === role)
              ) as AppRole[];

              return (
                <div key={user.id} className="p-6 bg-white/5 rounded-lg border border-white/10">
                  {/* Master - User Information */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white">{user.full_name || user.email}</h4>
                      <p className="text-sm text-white/60">{user.email}</p>
                    </div>
                    
                    {/* Quick Add Role Dropdown */}
                    {availableRoles.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            disabled={isAssigningRole}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Role
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-surface-dark border-white/20 w-64">
                          {availableRoles.map((role) => (
                            <DropdownMenuItem
                              key={role}
                              onClick={() => handleAssignRole(user.id, role)}
                              className="text-white hover:bg-white/10 cursor-pointer p-3"
                            >
                              <div className="flex items-center gap-3 w-full">
                                <div className={`p-1 rounded ${roleColors[role]}`}>
                                  {roleIcons[role]}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">{roleLabels[role]}</div>
                                  <div className="text-xs text-white/60">{roleDescriptions[role]}</div>
                                </div>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  
                  {/* Detail - Current Roles */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-white/80">Current Roles ({user.roles.length})</h5>
                    
                    {user.roles.length === 0 ? (
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                        <span className="text-white/40 text-sm">No roles assigned</span>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {user.roles.map((userRole) => (
                          <div 
                            key={`${userRole.user_id}-${userRole.role}`} 
                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${roleColors[userRole.role as AppRole]}`}>
                                {roleIcons[userRole.role as AppRole]}
                              </div>
                              <div>
                                <div className="font-medium text-white">
                                  {roleLabels[userRole.role as AppRole]}
                                </div>
                                <div className="text-sm text-white/60">
                                  {roleDescriptions[userRole.role as AppRole]}
                                </div>
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveRole(user.id, userRole.role as AppRole)}
                              disabled={isRemovingRole}
                              className="h-8 w-8 p-0 border-red-500/30 hover:bg-red-500/20"
                            >
                              <X className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
};
