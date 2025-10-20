import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { FlightTracking } from './useRotableParts';

export const useFlightTracking = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: flightTracking = [], isLoading, error } = useQuery({
    queryKey: ['flight-tracking', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('flight_tracking')
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
      return data as FlightTracking[];
    },
    enabled: !!user?.id,
  });

  const createTrackingMutation = useMutation({
    mutationFn: async (trackingData: Omit<FlightTracking, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'rotable_parts'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('flight_tracking')
        .insert({
          ...trackingData,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flight-tracking'] });
      toast.success('Flight tracking record added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add flight tracking: ${error.message}`);
    },
  });

  const updateTrackingMutation = useMutation({
    mutationFn: async ({ id, ...trackingData }: Partial<FlightTracking> & { id: string }) => {
      const { data, error } = await supabase
        .from('flight_tracking')
        .update(trackingData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flight-tracking'] });
      toast.success('Flight tracking updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update flight tracking: ${error.message}`);
    },
  });

  const deleteTrackingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('flight_tracking')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flight-tracking'] });
      toast.success('Flight tracking record deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete flight tracking: ${error.message}`);
    },
  });

  return {
    flightTracking,
    isLoading,
    error,
    createTracking: createTrackingMutation.mutate,
    updateTracking: updateTrackingMutation.mutate,
    deleteTracking: deleteTrackingMutation.mutate,
    isCreating: createTrackingMutation.isPending,
    isUpdating: updateTrackingMutation.isPending,
    isDeleting: deleteTrackingMutation.isPending,
  };
};