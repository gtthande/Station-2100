import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
  import { Badge } from '@/components/ui/badge';
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
  import { Users, Plus, Edit, Trash2, Shield, User, Info } from 'lucide-react';
  import { toast } from '@/hooks/use-toast';

interface SampleUser {
  id: string;
  email: string;
  full_name: string;
  bio?: string;
  position?: string;
  staff_code?: string;
  is_active: boolean;
  created_at: string;
  credential_type: string;
  access_level: string;
  last_credential_reset: string;
  requires_secure_login: boolean;
}

export function SampleUsersManagement() {
  const { user } = useAuth();
  const { isAdmin } = useUserRoles();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<SampleUser | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    bio: '',
    position: '',
    staff_code: '',
    credential_type: 'demo_user',
    access_level: 'basic'
  });

  // Fetch sample users
  const { data: sampleUsers, isLoading } = useQuery({
    queryKey: ['sample-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sample_user_credentials')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SampleUser[];
    },
    enabled: isAdmin()
  });

  // Add/Update user mutation
  const saveUserMutation = useMutation({
    mutationFn: async (userData: Partial<SampleUser>) => {
      if (userData.id) {
        // Update existing user
        const { error } = await supabase
          .from('sample_user_credentials')
          .update({
            email: userData.email,
            full_name: userData.full_name,
            bio: userData.bio,
            position: userData.position,
            staff_code: userData.staff_code,
            is_active: userData.is_active,
            credential_type: userData.credential_type,
            access_level: userData.access_level,
            last_credential_reset: new Date().toISOString()
          })
          .eq('id', userData.id);
        
        if (error) throw error;
      } else {
        // Add new user
        const { error } = await supabase
          .from('sample_user_credentials')
          .insert({
            email: userData.email,
            full_name: userData.full_name,
            bio: userData.bio,
            position: userData.position,
            staff_code: userData.staff_code,
            is_active: true,
            credential_type: userData.credential_type || 'demo_user',
            access_level: userData.access_level || 'basic',
            requires_secure_login: true
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sample-users'] });
      setEditingUser(null);
      setNewUser({
        email: '',
        full_name: '',
        bio: '',
        position: '',
        staff_code: '',
        credential_type: 'demo_user',
        access_level: 'basic'
      });
      toast({
        title: "Success",
        description: "Sample user saved successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save sample user",
        variant: "destructive"
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('sample_user_credentials')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sample-users'] });
      toast({
        title: "Success",
        description: "Sample user deleted successfully"
      });
    }
  });

  const handleSaveUser = (userData: Partial<SampleUser>) => {
    saveUserMutation.mutate(userData);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this sample user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const generateDemoCredentials = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('generate_demo_credentials', {
        _user_id: userId
      });
      
      if (error) throw error;
      
      toast({
        title: "Demo Credentials Generated",
        description: "Secure demo access information has been generated. Contact administrator for actual login credentials."
      });
      
      return data;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate demo credentials",
        variant: "destructive"
      });
    }
  };

  if (!isAdmin()) {
    return (
      <GlassCard>
        <GlassCardContent className="p-8 text-center">
          <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
          <p className="text-white/60">Only administrators can manage sample users.</p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sample Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sampleUsers?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sampleUsers?.filter(u => u.is_active)?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Staff Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {[...new Set(sampleUsers?.map(u => u.position).filter(Boolean))].length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sample Users Management */}
      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center justify-between">
            <GlassCardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Sample User Credentials
            </GlassCardTitle>
            <Button onClick={() => setEditingUser({} as SampleUser)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Sample User
            </Button>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Access Level</TableHead>
                  <TableHead>Credential Type</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground">{user.staff_code}</div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.access_level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="text-sm capitalize">{user.credential_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.position}</TableCell>
                    <TableCell>
                      <Badge className={user.is_active ? 'bg-green-500' : 'bg-gray-500'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingUser(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => generateDemoCredentials(user.id)}
                        title="Generate secure demo access"
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) || (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No sample users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {editingUser.id ? 'Edit Sample User' : 'Add Sample User'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={editingUser.full_name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    placeholder="john.smith@example.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={editingUser.position || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, position: e.target.value })}
                    placeholder="Senior Mechanic"
                  />
                </div>
                <div>
                  <Label htmlFor="staff_code">Staff Code</Label>
                  <Input
                    id="staff_code"
                    value={editingUser.staff_code || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, staff_code: e.target.value })}
                    placeholder="MECH001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="credential_type">Credential Type</Label>
                  <Select
                    value={editingUser.credential_type || 'demo_user'}
                    onValueChange={(value) => setEditingUser({ ...editingUser, credential_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select credential type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo_user">Demo User</SelectItem>
                      <SelectItem value="training_account">Training Account</SelectItem>
                      <SelectItem value="test_profile">Test Profile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="access_level">Access Level</Label>
                  <Select
                    value={editingUser.access_level || 'basic'}
                    onValueChange={(value) => setEditingUser({ ...editingUser, access_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select access level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Security Note</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      No actual passwords or PINs are stored. This profile is for demonstration purposes only. 
                      Real authentication credentials are managed through the secure authentication system.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={editingUser.bio || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                  placeholder="Brief description of the user's role and experience..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleSaveUser(editingUser)}
                  disabled={saveUserMutation.isPending}
                >
                  {editingUser.id ? 'Update' : 'Create'} User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}