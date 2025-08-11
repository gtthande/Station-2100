import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useCurrency } from './useCurrency';

export type StockMovementEvent = 'OPEN_BALANCE' | 'BATCH_RECEIPT' | 'JOB_CARD_ISSUE' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT';

export interface StockMovement {
  id: string;
  user_id: string;
  movement_date: string;
  product_id: string;
  batch_id?: string;
  event_type: StockMovementEvent;
  quantity: number;
  unit_cost: number;
  source_ref: string;
  department_id?: string;
  notes?: string;
  created_at: string;
  created_by: string;
  inventory_products?: {
    part_number: string;
    description: string;
  };
  inventory_batches?: {
    batch_number: string;
  };
}

export interface StockOnHand {
  product_id: string;
  batch_id?: string;
  quantity_on_hand: number;
  weighted_avg_cost: number;
  total_value: number;
}

export interface StockValuation {
  product_id: string;
  part_number: string;
  description: string;
  quantity_on_hand: number;
  weighted_avg_cost: number;
  total_value: number;
}

export interface BatchBreakdown {
  product_id: string;
  part_number: string;
  batch_id: string;
  batch_number: string;
  quantity_on_hand: number;
  weighted_avg_cost: number;
  total_value: number;
  date_received: string;
}

export const useStockMovements = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { formatCurrency } = useCurrency();

  // Fetch stock movements
  const {
    data: stockMovements = [],
    isLoading: isLoadingMovements,
    error: movementsError
  } = useQuery({
    queryKey: ['stock-movements', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          inventory_products(part_number, description),
          inventory_batches(batch_number)
        `)
        .eq('user_id', user.id)
        .order('movement_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StockMovement[];
    },
    enabled: !!user?.id,
  });

  // Create stock movement
  const createMovementMutation = useMutation({
    mutationFn: async (movement: Omit<StockMovement, 'id' | 'created_at' | 'user_id' | 'created_by'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('stock_movements')
        .insert({
          ...movement,
          user_id: user.id,
          created_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['stock-on-hand'] });
      queryClient.invalidateQueries({ queryKey: ['stock-valuation'] });
      queryClient.invalidateQueries({ queryKey: ['batch-breakdown'] });
      toast.success('Stock movement recorded successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record stock movement');
    },
  });

  // Get stock on hand
  const getStockOnHand = useCallback(async (
    productId: string,
    asOfDate?: string,
    batchId?: string
  ): Promise<StockOnHand[]> => {
    if (!user?.id) return [];

    const { data, error } = await supabase.rpc('get_stock_on_hand', {
      _user_id: user.id,
      _product_id: productId,
      _as_of_date: asOfDate || new Date().toISOString().split('T')[0],
      _batch_id: batchId || null,
    });

    if (error) throw error;
    return data || [];
  }, [user?.id]);

  // Get stock valuation report
  const getStockValuation = useCallback(async (asOfDate?: string): Promise<StockValuation[]> => {
    if (!user?.id) return [];

    const { data, error } = await supabase.rpc('get_stock_valuation_report', {
      _user_id: user.id,
      _as_of_date: asOfDate || new Date().toISOString().split('T')[0],
    });

    if (error) throw error;
    return data || [];
  }, [user?.id]);

  // Get batch breakdown report
  const getBatchBreakdown = useCallback(async (
    productId?: string,
    asOfDate?: string
  ): Promise<BatchBreakdown[]> => {
    if (!user?.id) return [];

    const { data, error } = await supabase.rpc('get_batch_breakdown_report', {
      _user_id: user.id,
      _product_id: productId || null,
      _as_of_date: asOfDate || new Date().toISOString().split('T')[0],
    });

    if (error) throw error;
    return data || [];
  }, [user?.id]);

  // Generate source reference
  const generateSourceRef = useCallback((eventType: StockMovementEvent, additionalData?: any): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    switch (eventType) {
      case 'OPEN_BALANCE':
        return `OB-${timestamp}-${random}`;
      case 'BATCH_RECEIPT':
        return `BR-${additionalData?.batchId || timestamp}-${random}`;
      case 'JOB_CARD_ISSUE':
        return `JC-${additionalData?.jobId || timestamp}-${random}`;
      case 'ADJUSTMENT_IN':
        return `AI-${timestamp}-${random}`;
      case 'ADJUSTMENT_OUT':
        return `AO-${timestamp}-${random}`;
      default:
        return `SM-${timestamp}-${random}`;
    }
  }, []);

  // Format currency helper
  const formatMovementValue = useCallback((quantity: number, unitCost: number): string => {
    return formatCurrency(quantity * unitCost);
  }, [formatCurrency]);

  return {
    stockMovements,
    isLoadingMovements,
    movementsError,
    createMovement: createMovementMutation.mutate,
    isCreatingMovement: createMovementMutation.isPending,
    getStockOnHand,
    getStockValuation,
    getBatchBreakdown,
    generateSourceRef,
    formatMovementValue,
  };
};