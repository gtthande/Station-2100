import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface RotableStockReport {
  part_id: string;
  part_number: string;
  serial_number: string;
  manufacturer: string;
  status: string;
  location?: string;
  condition: string;
  last_inspection?: string;
}

export interface LLPExpiryForecast {
  part_id: string;
  part_number: string;
  serial_number: string;
  aircraft_tail_number: string;
  current_hours: number;
  current_cycles: number;
  hours_limit?: number;
  cycles_limit?: number;
  calendar_limit_days?: number;
  next_inspection_due?: string;
  days_until_due: number;
  priority: 'critical' | 'warning' | 'normal';
}

export interface InstallationHistoryReport {
  part_id: string;
  part_number: string;
  serial_number: string;
  aircraft_id: string;
  installation_date: string;
  removal_date?: string;
  reason_for_removal?: string;
  performed_by: string;
  flight_hours_at_install: number;
  flight_cycles_at_install: number;
}

export interface RepairTurnaroundReport {
  part_id: string;
  part_number: string;
  serial_number: string;
  sent_date: string;
  facility: string;
  expected_return: string;
  actual_return?: string;
  turnaround_days: number;
  status: string;
  cost?: number;
}

export const useRotableReports = () => {
  const { user } = useAuth();

  const { data: stockReport = [], isLoading: isLoadingStock } = useQuery({
    queryKey: ['rotable-stock-report', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('rotable_parts')
        .select('*')
        .eq('user_id', user.id)
        .order('part_number');
      
      if (error) throw error;
      
      return data.map(part => ({
        part_id: part.id,
        part_number: part.part_number,
        serial_number: part.serial_number,
        manufacturer: part.manufacturer,
        status: part.status,
        location: part.location,
        condition: part.status === 'serviceable' ? 'Serviceable' : 'Unserviceable',
        last_inspection: null, // TODO: Calculate from installation logs
      })) as RotableStockReport[];
    },
    enabled: !!user?.id,
  });

  const { data: llpForecast = [], isLoading: isLoadingForecast } = useQuery({
    queryKey: ['llp-expiry-forecast', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('flight_tracking')
        .select(`
          *,
          rotable_parts (
            id,
            part_number,
            serial_number
          )
        `)
        .eq('user_id', user.id)
        .not('next_inspection_due', 'is', null)
        .order('next_inspection_due');
      
      if (error) throw error;
      
      return data.map(tracking => {
        const daysUntilDue = tracking.next_inspection_due 
          ? Math.ceil((new Date(tracking.next_inspection_due).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        let priority: 'critical' | 'warning' | 'normal' = 'normal';
        if (daysUntilDue <= 30) priority = 'critical';
        else if (daysUntilDue <= 90) priority = 'warning';
        
        return {
          part_id: tracking.rotable_part_id,
          part_number: tracking.rotable_parts?.part_number || '',
          serial_number: tracking.rotable_parts?.serial_number || '',
          aircraft_tail_number: tracking.aircraft_tail_number,
          current_hours: Number(tracking.flight_hours),
          current_cycles: tracking.flight_cycles,
          hours_limit: tracking.flight_hours_limit ? Number(tracking.flight_hours_limit) : undefined,
          cycles_limit: tracking.flight_cycles_limit,
          calendar_limit_days: tracking.calendar_time_limit_days,
          next_inspection_due: tracking.next_inspection_due,
          days_until_due: daysUntilDue,
          priority,
        };
      }) as LLPExpiryForecast[];
    },
    enabled: !!user?.id,
  });

  const { data: installationHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['installation-history-report', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('installation_removal_logs')
        .select(`
          *,
          rotable_parts (
            id,
            part_number,
            serial_number
          )
        `)
        .eq('user_id', user.id)
        .order('log_date', { ascending: false });
      
      if (error) throw error;
      
      return data.map(log => ({
        part_id: log.rotable_part_id,
        part_number: log.rotable_parts?.part_number || '',
        serial_number: log.rotable_parts?.serial_number || '',
        aircraft_id: log.aircraft_id,
        installation_date: log.log_date,
        removal_date: log.log_type === 'removal' ? log.log_date : undefined,
        reason_for_removal: log.reason_for_removal,
        performed_by: log.performed_by_name || '',
        flight_hours_at_install: Number(log.flight_hours_at_action || 0),
        flight_cycles_at_install: log.flight_cycles_at_action || 0,
      })) as InstallationHistoryReport[];
    },
    enabled: !!user?.id,
  });

  const { data: repairTurnaround = [], isLoading: isLoadingTurnaround } = useQuery({
    queryKey: ['repair-turnaround-report', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('repair_exchange_records')
        .select(`
          *,
          rotable_parts (
            id,
            part_number,
            serial_number
          )
        `)
        .eq('user_id', user.id)
        .order('sent_date', { ascending: false });
      
      if (error) throw error;
      
      return data.map(record => {
        const sentDate = new Date(record.sent_date);
        const returnDate = record.actual_return_date ? new Date(record.actual_return_date) : new Date();
        const turnaroundDays = Math.ceil((returnDate.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          part_id: record.rotable_part_id,
          part_number: record.rotable_parts?.part_number || '',
          serial_number: record.rotable_parts?.serial_number || '',
          sent_date: record.sent_date,
          facility: record.sent_to_facility,
          expected_return: record.expected_return_date || '',
          actual_return: record.actual_return_date,
          turnaround_days: turnaroundDays,
          status: record.status,
          cost: record.cost ? Number(record.cost) : undefined,
        };
      }) as RepairTurnaroundReport[];
    },
    enabled: !!user?.id,
  });

  return {
    stockReport,
    llpForecast,
    installationHistory,
    repairTurnaround,
    isLoading: isLoadingStock || isLoadingForecast || isLoadingHistory || isLoadingTurnaround,
  };
};