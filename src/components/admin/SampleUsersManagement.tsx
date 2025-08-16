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
import { Users, Plus, Edit, Trash2, Eye, EyeOff, Key, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SampleUser {
  id: string;
  email: string;
  full_name: string;
  pin_code: string;
  bio?: string;
  sample_password: string;
  position?: string;
  staff_code?: string;
  is_active: boolean;
  created_at: string;
}

export function SampleUsersManagement() {
  const { user } = useAuth();
  const { isAdmin } = useUserRoles();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<SampleUser | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    pin_code: '',
    bio: '',
    sample_password: '',
    position: '',
    staff_code: ''
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
            pin_code: userData.pin_code,
            bio: userData.bio,
            sample_password: userData.sample_password,
            position: userData.position,
            staff_code: userData.staff_code,
            is_active: userData.is_active
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
            pin_code: userData.pin_code,
            bio: userData.bio,
            sample_password: userData.sample_password,
            position: userData.position,
            staff_code: userData.staff_code,
            is_active: true
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
        pin_code: '',
        bio: '',
        sample_password: '',
        position: '',
        staff_code: ''
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

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const generateRandomPIN = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
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
                  <TableHead>PIN</TableHead>
                  <TableHead>Password</TableHead>
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
                      <Badge variant="outline" className="font-mono">
                        {user.pin_code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {showPasswords[user.id] ? user.sample_password : '••••••••••'}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => togglePasswordVisibility(user.id)}
                        >
                          {showPasswords[user.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
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
                  <Label htmlFor="pin_code">4-Digit PIN</Label>
                  <div className="flex gap-2">
                    <Input
                      id="pin_code"
                      value={editingUser.pin_code || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, pin_code: e.target.value.slice(0, 4) })}
                      placeholder="1234"
                      maxLength={4}
                      pattern="[0-9]{4}"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingUser({ ...editingUser, pin_code: generateRandomPIN() })}
                      title="Generate random PIN"
                    >
                      <Key className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="sample_password">Sample Password</Label>
                  <div className="flex gap-2">
                    <Input
                      id="sample_password"
                      value={editingUser.sample_password || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, sample_password: e.target.value })}
                      placeholder="Password123!"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingUser({ ...editingUser, sample_password: generateRandomPassword() })}
                      title="Generate random password"
                    >
                      <Key className="w-4 h-4" />
                    </Button>
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