import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface RotablePart {
  id: string;
  user_id: string;
  serial_number: string;
  part_number: string;
  manufacturer: string;
  ata_chapter?: string;
  status: 'installed' | 'in_stock' | 'sent_to_oem' | 'awaiting_repair' | 'serviceable' | 'unserviceable';
  description?: string;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FlightTracking {
  id: string;
  user_id: string;
  rotable_part_id: string;
  aircraft_tail_number: string;
  flight_hours: number;
  flight_cycles: number;
  installation_date?: string;
  removal_date?: string;
  calendar_time_limit_days?: number;
  flight_hours_limit?: number;
  flight_cycles_limit?: number;
  next_inspection_due?: string;
  created_at: string;
  updated_at: string;
  rotable_parts?: RotablePart;
}

export interface RotableAlert {
  id: string;
  user_id: string;
  rotable_part_id: string;
  alert_type: string;
  threshold_value?: number;
  current_value?: number;
  alert_date?: string;
  is_acknowledged: boolean;
  acknowledged_at?: string;
  acknowledged_by?: string;
  created_at: string;
  rotable_parts?: RotablePart;
}

export const useRotableParts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: rotableParts = [], isLoading, error } = useQuery({
    queryKey: ['rotable-parts', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('rotable_parts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as RotablePart[];
    },
    enabled: !!user?.id,
  });

  const createPartMutation = useMutation({
    mutationFn: async (partData: Omit<RotablePart, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('rotable_parts')
        .insert({
          ...partData,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotable-parts'] });
      toast.success('Rotable part added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add rotable part: ${error.message}`);
    },
  });

  const updatePartMutation = useMutation({
    mutationFn: async ({ id, ...partData }: Partial<RotablePart> & { id: string }) => {
      const { data, error } = await supabase
        .from('rotable_parts')
        .update(partData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotable-parts'] });
      toast.success('Rotable part updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update rotable part: ${error.message}`);
    },
  });

  const deletePartMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rotable_parts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotable-parts'] });
      toast.success('Rotable part deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete rotable part: ${error.message}`);
    },
  });

  return {
    rotableParts,
    isLoading,
    error,
    createPart: createPartMutation.mutate,
    updatePart: updatePartMutation.mutate,
    deletePart: deletePartMutation.mutate,
    isCreating: createPartMutation.isPending,
    isUpdating: updatePartMutation.isPending,
    isDeleting: deletePartMutation.isPending,
  };
};