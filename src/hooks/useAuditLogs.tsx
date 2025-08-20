import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface AuditLog {
  id: string;
  user_id: string;
  rotable_part_id?: string;
  action_type: string;
  action_description: string;
  performed_by: string;
  ip_address?: string;
  user_agent?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  related_table?: string;
  related_id?: string;
  created_at: string;
}

export const useAuditLogs = (rotablePartId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: auditLogs = [], isLoading, error } = useQuery({
    queryKey: ['rotable-audit-logs', user?.id, rotablePartId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      let query = supabase
        .from('rotable_audit_logs')
        .select('*')
        .eq('user_id', user.id);
      
      if (rotablePartId) {
        query = query.eq('rotable_part_id', rotablePartId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AuditLog[];
    },
    enabled: !!user?.id,
  });

  const logActionMutation = useMutation({
    mutationFn: async ({
      rotablePartId,
      actionType,
      actionDescription,
      oldValues,
      newValues,
      relatedTable,
      relatedId,
    }: {
      rotablePartId?: string;
      actionType: string;
      actionDescription: string;
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
      relatedTable?: string;
      relatedId?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase.rpc('log_rotable_action', {
        _rotable_part_id: rotablePartId || null,
        _action_type: actionType,
        _action_description: actionDescription,
        _old_values: oldValues ? JSON.stringify(oldValues) : null,
        _new_values: newValues ? JSON.stringify(newValues) : null,
        _related_table: relatedTable || null,
        _related_id: relatedId || null,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotable-audit-logs'] });
    },
    onError: (error) => {
      console.error('Failed to log action:', error);
    },
  });

  return {
    auditLogs,
    isLoading,
    error,
    logAction: logActionMutation.mutate,
    isLogging: logActionMutation.isPending,
  };
};