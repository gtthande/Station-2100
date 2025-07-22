
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRoles } from '@/hooks/useUserRoles';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Settings, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const customRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').regex(/^[a-z_]+$/, 'Role name must be lowercase with underscores only'),
  label: z.string().min(1, 'Role label is required'),
  description: z.string().optional(),
});

type CustomRoleForm = z.infer<typeof customRoleSchema>;

interface CustomRole {
  id: string;
  name: string;
  label: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const CustomRoleManagement = () => {
  const { canManageSystem } = useUserRoles();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const form = useForm<CustomRoleForm>({
    resolver: zodResolver(customRoleSchema),
    defaultValues: {
      name: '',
      label: '',
      description: '',
    },
  });

  const { data: customRoles, isLoading } = useQuery({
    queryKey: ['custom-roles'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('custom_roles')
        .select('*')
        .order('label');
      
      if (error) throw error;
      return data as CustomRole[];
    },
    enabled: canManageSystem(),
  });

  const createRoleMutation = useMutation({
    mutationFn: async (roleData: CustomRoleForm) => {
      const { data, error } = await (supabase as any)
        .from('custom_roles')
        .insert(roleData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Custom Role Created",
        description: "The custom role has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await (supabase as any)
        .from('custom_roles')
        .delete()
        .eq('id', roleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Custom Role Deleted",
        description: "The custom role has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CustomRoleForm) => {
    createRoleMutation.mutate(data);
  };

  if (!canManageSystem()) {
    return null;
  }

  return (
    <GlassCard>
      <GlassCardHeader>
        <div className="flex items-center justify-between">
          <GlassCardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Custom Role Management
          </GlassCardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Role
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-surface-dark border-white/20 text-white">
              <DialogHeader>
                <DialogTitle>Create Custom Role</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role Name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., view_reports"
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </FormControl>
                        <FormDescription className="text-white/60">
                          Use lowercase letters and underscores only
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Label *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., View Reports"
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Describe what this role can do"
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createRoleMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </GlassCardHeader>
      <GlassCardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">Loading custom roles...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {customRoles?.map((role) => (
              <div key={role.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <h4 className="font-semibold text-white">{role.label}</h4>
                  <p className="text-sm text-white/60">{role.name}</p>
                  {role.description && (
                    <p className="text-sm text-white/50 mt-1">{role.description}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteRoleMutation.mutate(role.id)}
                  disabled={deleteRoleMutation.isPending}
                  className="h-8 w-8 p-0 border-red-500/30 hover:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            ))}
            {customRoles?.length === 0 && (
              <div className="text-center py-8 text-white/60">
                No custom roles created yet. Create your first custom role to get started.
              </div>
            )}
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
};
