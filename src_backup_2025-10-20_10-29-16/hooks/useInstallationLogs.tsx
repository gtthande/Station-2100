import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface InstallationRemovalLog {
  id: string;
  user_id: string;
  rotable_part_id: string;
  aircraft_id: string;
  log_type: 'installation' | 'removal';
  log_date: string;
  flight_hours_at_action?: number;
  flight_cycles_at_action?: number;
  performed_by_staff_id?: string;
  performed_by_name?: string;
  reason_for_removal?: string;
  maintenance_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  rotable_parts?: {
    id: string;
    serial_number: string;
    part_number: string;
    manufacturer: string;
  };
}

export interface RepairExchangeRecord {
  id: string;
  user_id: string;
  rotable_part_id: string;
  record_type: 'repair' | 'exchange' | 'overhaul';
  sent_to_facility: string;
  sent_date: string;
  expected_return_date?: string;
  actual_return_date?: string;
  cost?: number;
  warranty_expiry_date?: string;
  warranty_terms?: string;
  new_tso_hours?: number;
  new_tso_cycles?: number;
  exchange_part_serial?: string;
  work_order_number?: string;
  certification_reference?: string;
  status: 'sent' | 'in_progress' | 'completed' | 'returned';
  notes?: string;
  created_at: string;
  updated_at: string;
  rotable_parts?: {
    id: string;
    serial_number: string;
    part_number: string;
    manufacturer: string;
  };
}

export interface PooledPart {
  id: string;
  user_id: string;
  rotable_part_id: string;
  pool_name: string;
  pool_operator?: string;
  sharing_agreement_ref?: string;
  available_for_pool: boolean;
  pool_priority: number;
  usage_cost_per_hour?: number;
  usage_cost_per_cycle?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  rotable_parts?: {
    id: string;
    serial_number: string;
    part_number: string;
    manufacturer: string;
    status: string;
  };
}

export interface WarehouseLocation {
  id: string;
  user_id: string;
  rotable_part_id: string;
  warehouse_code: string;
  aisle?: string;
  shelf?: string;
  bin?: string;
  is_current_location: boolean;
  moved_date: string;
  moved_by_staff_id?: string;
  moved_by_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  rotable_parts?: {
    id: string;
    serial_number: string;
    part_number: string;
    manufacturer: string;
  };
}

export const useInstallationRemovalLogs = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ['installation-removal-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('installation_removal_logs')
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
        .order('log_date', { ascending: false });
      
      if (error) throw error;
      return data as InstallationRemovalLog[];
    },
    enabled: !!user?.id,
  });

  const createLogMutation = useMutation({
    mutationFn: async (logData: Omit<InstallationRemovalLog, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'rotable_parts'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('installation_removal_logs')
        .insert({
          ...logData,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installation-removal-logs'] });
      toast.success('Installation/Removal log added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add log: ${error.message}`);
    },
  });

  const updateLogMutation = useMutation({
    mutationFn: async ({ id, ...logData }: Partial<InstallationRemovalLog> & { id: string }) => {
      const { data, error } = await supabase
        .from('installation_removal_logs')
        .update(logData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installation-removal-logs'] });
      toast.success('Log updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update log: ${error.message}`);
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('installation_removal_logs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installation-removal-logs'] });
      toast.success('Log deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete log: ${error.message}`);
    },
  });

  return {
    logs,
    isLoading,
    error,
    createLog: createLogMutation.mutate,
    updateLog: updateLogMutation.mutate,
    deleteLog: deleteLogMutation.mutate,
    isCreating: createLogMutation.isPending,
    isUpdating: updateLogMutation.isPending,
    isDeleting: deleteLogMutation.isPending,
  };
};