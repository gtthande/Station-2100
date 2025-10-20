import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCustomerPermissions, CustomerPermissionType } from '@/hooks/useCustomerPermissions';
import { useUserRoles } from '@/hooks/useUserRoles';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Shield, Plus, Trash2, Search, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

const permissionLabels: Record<CustomerPermissionType, string> = {
  'view_basic': 'View Basic Info',
  'view_contact': 'View Contact Info',
  'view_full': 'View Full Details',
  'manage': 'Full Management'
};

const permissionDescriptions: Record<CustomerPermissionType, string> = {
  'view_basic': 'Can see customer name, aircraft info, and country only',
  'view_contact': 'Can view email, phone, and contact person (+ basic info)',
  'view_full': 'Can view all customer data including full address and notes',
  'manage': 'Can create, edit, and update customer records (+ all viewing rights)'
};

const permissionColors: Record<CustomerPermissionType, string> = {
  'view_basic': 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  'view_contact': 'bg-green-500/20 text-green-300 border-green-400/30',
  'view_full': 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
  'manage': 'bg-red-500/20 text-red-300 border-red-400/30'
};

export const CustomerPermissionManagement = () => {
  const { canManageSystem } = useUserRoles();
  const { allPermissions, grantPermission, revokePermission, isGrantingPermission, isRevokingPermission } = useCustomerPermissions();
  const [searchEmail, setSearchEmail] = useState('');
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false);
  const [newPermission, setNewPermission] = useState<{
    userId: string;
    permission: CustomerPermissionType | '';
    expiresAt: string;
    notes: string;
  }>({
    userId: '',
    permission: '',
    expiresAt: '',
    notes: ''
  });

  // Get all users (profiles)
  const { data: profiles } = useQuery({
    queryKey: ['profiles-for-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');
      
      if (error) throw error;
      return data;
    },
  });

  if (!canManageSystem()) {
    return (
      <GlassCard>
        <GlassCardContent className="text-center py-8">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Access denied. Only administrators can manage customer permissions.</p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  const filteredProfiles = profiles?.filter(p => 
    p.email?.toLowerCase().includes(searchEmail.toLowerCase()) ||
    p.full_name?.toLowerCase().includes(searchEmail.toLowerCase())
  ) || [];

  const handleGrantPermission = () => {
    if (!newPermission.userId || !newPermission.permission) return;
    
    grantPermission({
      userId: newPermission.userId,
      permission: newPermission.permission as CustomerPermissionType,
      expiresAt: newPermission.expiresAt || undefined,
      notes: newPermission.notes || undefined
    });
    
    setIsGrantDialogOpen(false);
    setNewPermission({ userId: '', permission: '', expiresAt: '', notes: '' });
  };

  const getUserPermissions = (userId: string) => {
    return allPermissions?.filter(p => p.user_id === userId) || [];
  };

  const isPermissionExpired = (expiresAt?: string) => {
    return expiresAt ? new Date(expiresAt) < new Date() : false;
  };

  return (
    <div className="space-y-6">
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Customer Data Permissions
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(permissionLabels).map(([permission, label]) => (
              <div key={permission} className="text-center">
                <Badge className={`w-full justify-center mb-2 ${permissionColors[permission as CustomerPermissionType]}`}>
                  {label}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {permissionDescriptions[permission as CustomerPermissionType]}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search-email">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-email"
                  placeholder="Search by name or email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Dialog open={isGrantDialogOpen} onOpenChange={setIsGrantDialogOpen}>
                <DialogTrigger asChild>
                  <GradientButton>
                    <Plus className="h-4 w-4 mr-2" />
                    Grant Permission
                  </GradientButton>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Grant Customer Permission</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="user-select">User</Label>
                      <Select value={newPermission.userId} onValueChange={(value) => 
                        setNewPermission({ ...newPermission, userId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user..." />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles?.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.full_name} ({profile.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="permission-select">Permission Level</Label>
                      <Select value={newPermission.permission} onValueChange={(value) => 
                        setNewPermission({ ...newPermission, permission: value as CustomerPermissionType })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select permission..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(permissionLabels).map(([permission, label]) => (
                            <SelectItem key={permission} value={permission}>
                              {label} - {permissionDescriptions[permission as CustomerPermissionType]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="expires-at">Expires At (Optional)</Label>
                      <Input
                        id="expires-at"
                        type="datetime-local"
                        value={newPermission.expiresAt}
                        onChange={(e) => setNewPermission({ ...newPermission, expiresAt: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Reason for granting permission..."
                        value={newPermission.notes}
                        onChange={(e) => setNewPermission({ ...newPermission, notes: e.target.value })}
                      />
                    </div>

                    <div className="flex gap-2">
                      <GradientButton 
                        onClick={handleGrantPermission}
                        disabled={!newPermission.userId || !newPermission.permission || isGrantingPermission}
                        className="flex-1"
                      >
                        Grant Permission
                      </GradientButton>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>User Permissions</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-4">
            {filteredProfiles.map((profile) => {
              const userPermissions = getUserPermissions(profile.id);
              return (
                <div key={profile.id} className="border border-border/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{profile.full_name}</span>
                      <span className="text-sm text-muted-foreground">({profile.email})</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {userPermissions.length === 0 ? (
                      <span className="text-sm text-muted-foreground">No customer permissions</span>
                    ) : (
                      userPermissions.map((permission) => {
                        const isExpired = isPermissionExpired(permission.expires_at);
                        return (
                          <div key={permission.id} className="flex items-center gap-2">
                            <Badge 
                              className={`${permissionColors[permission.permission_type]} ${isExpired ? 'opacity-50' : ''}`}
                            >
                              {permissionLabels[permission.permission_type]}
                              {permission.expires_at && (
                                <Clock className="h-3 w-3 ml-1" />
                              )}
                            </Badge>
                            {permission.expires_at && (
                              <span className="text-xs text-muted-foreground">
                                {isExpired ? 'Expired' : 'Expires'}: {format(new Date(permission.expires_at), 'MMM dd, yyyy')}
                              </span>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button className="text-destructive hover:text-destructive/80">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Revoke Permission</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to revoke the "{permissionLabels[permission.permission_type]}" permission from {profile.full_name}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => revokePermission({ 
                                      userId: profile.id, 
                                      permission: permission.permission_type as CustomerPermissionType
                                    })}
                                    disabled={isRevokingPermission}
                                  >
                                    Revoke
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        );
                      })
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