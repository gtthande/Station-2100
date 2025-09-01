import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';

export function InventoryMovementSummary() {
  const { user } = useAuth();

  const { data: movementData = [], isLoading } = useQuery({
    queryKey: ['inventory-movement-summary'],
    queryFn: async () => {
      if (!user) return [];
      
      // Get last 30 days of movements
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          event_type, 
          quantity, 
          unit_cost,
          movement_date,
          inventory_products(part_number, description)
        `)
        .gte('movement_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('movement_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const summary = useMemo(() => {
    let totalIncoming = 0;
    let totalOutgoing = 0;
    let totalIncomingValue = 0;
    let totalOutgoingValue = 0;
    let uniqueProducts = new Set();
    
    for (const movement of movementData) {
      const qty = Number(movement.quantity || 0);
      const cost = Number(movement.unit_cost || 0);
      const value = Math.abs(qty) * cost;
      
      if (movement.inventory_products?.part_number) {
        uniqueProducts.add(movement.inventory_products.part_number);
      }
      
      if (movement.event_type === 'OPEN_BALANCE' || 
          movement.event_type === 'BATCH_RECEIPT' || 
          movement.event_type === 'ADJUSTMENT_IN') {
        totalIncoming += qty;
        totalIncomingValue += value;
      } else {
        totalOutgoing += Math.abs(qty);
        totalOutgoingValue += value;
      }
    }
    
    return {
      totalIncoming,
      totalOutgoing,
      net: totalIncoming - totalOutgoing,
      totalIncomingValue,
      totalOutgoingValue,
      netValue: totalIncomingValue - totalOutgoingValue,
      uniqueProducts: uniqueProducts.size,
      totalTransactions: movementData.length
    };
  }, [movementData]);

  if (isLoading) {
    return (
      <GlassCard>
        <GlassCardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
          <p className="text-white/70 text-sm">Loading movement summary...</p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          30-Day Movement Summary
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Incoming */}
          <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">Incoming</span>
            </div>
            <div className="text-lg font-bold text-green-300">{summary.totalIncoming}</div>
            <div className="text-xs text-green-400">
              ${summary.totalIncomingValue.toLocaleString(undefined, { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
              })}
            </div>
          </div>

          {/* Outgoing */}
          <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">Outgoing</span>
            </div>
            <div className="text-lg font-bold text-red-300">{summary.totalOutgoing}</div>
            <div className="text-xs text-red-400">
              ${summary.totalOutgoingValue.toLocaleString(undefined, { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
              })}
            </div>
          </div>

          {/* Net Position */}
          <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400">Net</span>
            </div>
            <div className="text-lg font-bold text-blue-300">{summary.net}</div>
            <div className="text-xs text-blue-400">
              ${summary.netValue.toLocaleString(undefined, { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
              })}
            </div>
          </div>

          {/* Activity */}
          <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-400">Activity</span>
            </div>
            <div className="text-lg font-bold text-purple-300">{summary.uniqueProducts}</div>
            <div className="text-xs text-purple-400">
              products, {summary.totalTransactions} transactions
            </div>
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}



