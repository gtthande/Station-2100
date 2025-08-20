import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { RepairExchangeRecord } from './useInstallationLogs';

export const useRepairExchange = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: records = [], isLoading, error } = useQuery({
    queryKey: ['repair-exchange-records', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('repair_exchange_records')
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
        .order('sent_date', { ascending: false });
      
      if (error) throw error;
      return data as RepairExchangeRecord[];
    },
    enabled: !!user?.id,
  });

  const createRecordMutation = useMutation({
    mutationFn: async (recordData: Omit<RepairExchangeRecord, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'rotable_parts'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('repair_exchange_records')
        .insert({
          ...recordData,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-exchange-records'] });
      toast.success('Repair/Exchange record added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add record: ${error.message}`);
    },
  });

  const updateRecordMutation = useMutation({
    mutationFn: async ({ id, ...recordData }: Partial<RepairExchangeRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from('repair_exchange_records')
        .update(recordData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-exchange-records'] });
      toast.success('Record updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update record: ${error.message}`);
    },
  });

  const deleteRecordMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('repair_exchange_records')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repair-exchange-records'] });
      toast.success('Record deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete record: ${error.message}`);
    },
  });

  return {
    records,
    isLoading,
    error,
    createRecord: createRecordMutation.mutate,
    updateRecord: updateRecordMutation.mutate,
    deleteRecord: deleteRecordMutation.mutate,
    isCreating: createRecordMutation.isPending,
    isUpdating: updateRecordMutation.isPending,
    isDeleting: deleteRecordMutation.isPending,
  };
};