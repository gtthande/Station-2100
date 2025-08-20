import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { RotableAlert } from './useRotableParts';

export const useRotableAlerts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: ['rotable-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('rotable_alerts')
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
        .order('alert_date', { ascending: true });
      
      if (error) throw error;
      return data as RotableAlert[];
    },
    enabled: !!user?.id,
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('rotable_alerts')
        .update({
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id,
        })
        .eq('id', alertId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotable-alerts'] });
      toast.success('Alert acknowledged successfully');
    },
    onError: (error) => {
      toast.error(`Failed to acknowledge alert: ${error.message}`);
    },
  });

  return {
    alerts,
    isLoading,
    error,
    acknowledgeAlert: acknowledgeAlertMutation.mutate,
    isAcknowledging: acknowledgeAlertMutation.isPending,
  };
};