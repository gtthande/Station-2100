import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { PooledPart, WarehouseLocation } from './useInstallationLogs';

export const useInventoryPooling = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pooledParts = [], isLoading: isLoadingPooled, error: pooledError } = useQuery({
    queryKey: ['pooled-parts', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('pooled_parts')
        .select(`
          *,
          rotable_parts (
            id,
            serial_number,
            part_number,
            manufacturer,
            status
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PooledPart[];
    },
    enabled: !!user?.id,
  });

  const { data: warehouseLocations = [], isLoading: isLoadingLocations, error: locationsError } = useQuery({
    queryKey: ['warehouse-locations', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('warehouse_locations')
        .select(`
          *,
          rotable_parts (
            id,
            serial_number,
            part_number,
            manufacturer
          )
        `)
        .eq('user_id', user.id)
        .eq('is_current_location', true)
        .order('moved_date', { ascending: false });
      
      if (error) throw error;
      return data as WarehouseLocation[];
    },
    enabled: !!user?.id,
  });

  const createPooledPartMutation = useMutation({
    mutationFn: async (poolData: Omit<PooledPart, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'rotable_parts'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('pooled_parts')
        .insert({
          ...poolData,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pooled-parts'] });
      toast.success('Pooled part added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add pooled part: ${error.message}`);
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: async (locationData: Omit<WarehouseLocation, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'rotable_parts'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // First, mark any existing current location as false
      if (locationData.is_current_location) {
        await supabase
          .from('warehouse_locations')
          .update({ is_current_location: false })
          .eq('rotable_part_id', locationData.rotable_part_id)
          .eq('user_id', user.id);
      }
      
      const { data, error } = await supabase
        .from('warehouse_locations')
        .insert({
          ...locationData,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-locations'] });
      toast.success('Location updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update location: ${error.message}`);
    },
  });

  const updatePooledPartMutation = useMutation({
    mutationFn: async ({ id, ...poolData }: Partial<PooledPart> & { id: string }) => {
      const { data, error } = await supabase
        .from('pooled_parts')
        .update(poolData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pooled-parts'] });
      toast.success('Pooled part updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update pooled part: ${error.message}`);
    },
  });

  const deletePooledPartMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pooled_parts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pooled-parts'] });
      toast.success('Pooled part removed successfully');
    },
    onError: (error) => {
      toast.error(`Failed to remove pooled part: ${error.message}`);
    },
  });

  return {
    pooledParts,
    warehouseLocations,
    isLoading: isLoadingPooled || isLoadingLocations,
    error: pooledError || locationsError,
    createPooledPart: createPooledPartMutation.mutate,
    createLocation: createLocationMutation.mutate,
    updatePooledPart: updatePooledPartMutation.mutate,
    deletePooledPart: deletePooledPartMutation.mutate,
    isCreating: createPooledPartMutation.isPending || createLocationMutation.isPending,
    isUpdating: updatePooledPartMutation.isPending,
    isDeleting: deletePooledPartMutation.isPending,
  };
};