import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Users, Shield, UserPlus, UserMinus, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserWithRoles {
  id: string;
  email: string;
  full_name?: string;
  roles: string[];
  has_hr_role: boolean;
}

export function HRManagement() {
  const { user } = useAuth();
  const { isAdmin } = useUserRoles();
  const queryClient = useQueryClient();

  const { data: usersWithRoles, isLoading } = useQuery({
    queryKey: ['hr-users-management'],
    queryFn: async () => {
      if (!user?.id || !isAdmin) return [];
      
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('email');

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine the data
      const usersWithRoles: UserWithRoles[] = profiles.map(profile => {
        const roles = userRoles.filter(role => role.user_id === profile.id).map(role => role.role);
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name || undefined,
          roles,
          has_hr_role: roles.includes('hr')
        };
      });

      return usersWithRoles;
    },
    enabled: !!user?.id && isAdmin,
  });

  const assignHRRole = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'hr'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "HR role assigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['hr-users-management'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign HR role",
        variant: "destructive",
      });
    },
  });

  const removeHRRole = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'hr');

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "HR role removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['hr-users-management'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove HR role",
        variant: "destructive",
      });
    },
  });

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You need administrator privileges to manage HR roles.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading HR Management...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const hrUsers = usersWithRoles?.filter(user => user.has_hr_role) || [];
  const nonHRUsers = usersWithRoles?.filter(user => !user.has_hr_role) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            HR Role Management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage users who can access employee personal information for HR purposes
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-200">Security Notice</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  HR role grants access to all employee personal information including emails, phone numbers, 
                  and biometric data. Only assign this role to trusted HR personnel.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current HR Users */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Current HR Users ({hrUsers.length})
              </h3>
              {hrUsers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hrUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.full_name || user.email}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            <Badge variant="secondary" className="mt-1">HR Access</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <UserMinus className="h-4 w-4 mr-2" />
                                Remove HR Role
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove HR Role</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove HR role from {user.full_name || user.email}? 
                                  They will no longer be able to access employee personal information.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => removeHRRole.mutate(user.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove Role
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No HR users assigned</p>
              )}
            </div>

            {/* Available Users */}
            <div>
              <h3 className="text-lg font-medium mb-4">
                Assign HR Role
              </h3>
              {nonHRUsers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nonHRUsers.slice(0, 10).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.full_name || user.email}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            {user.roles.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {user.roles.map(role => (
                                  <Badge key={role} variant="outline" className="text-xs">
                                    {role}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="default" size="sm">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Assign HR Role
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Assign HR Role</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to assign HR role to {user.full_name || user.email}? 
                                  This will grant them access to all employee personal information including 
                                  emails, phone numbers, and biometric data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => assignHRRole.mutate(user.id)}
                                >
                                  Assign Role
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">All users have been assigned HR roles</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}