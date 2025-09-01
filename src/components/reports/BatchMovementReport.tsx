import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Calendar, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  productId?: string;
  batchId?: string;
}

export function BatchMovementReport({ productId, batchId }: Props) {
  const { user } = useAuth();
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [valueDate, setValueDate] = useState<string>('');

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['batch-movement', productId, batchId, from, to],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('stock_movements')
        .select(`
          movement_date, 
          event_type, 
          quantity, 
          unit_cost, 
          reference_number,
          notes,
          inventory_batches(batch_number), 
          inventory_products(part_number, description)
        `)
        .order('movement_date', { ascending: true });
      if (productId) query = query.eq('product_id', productId);
      if (batchId) query = query.eq('batch_id', batchId);
      if (from) query = query.gte('movement_date', from);
      if (to) query = query.lte('movement_date', to);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Get batch info for context
  const { data: batchInfo } = useQuery({
    queryKey: ['batch-info', batchId],
    queryFn: async () => {
      if (!batchId || !user) return null;
      const { data, error } = await supabase
        .from('inventory_batches')
        .select(`
          batch_number,
          cost_per_unit,
          quantity,
          received_date,
          inventory_products(part_number, description)
        `)
        .eq('id', batchId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!batchId && !!user,
  });

  const summary = useMemo(() => {
    let incoming = 0;
    let outgoing = 0;
    let incomingValue = 0;
    let outgoingValue = 0;
    let historicalValue = 0;
    
    for (const r of rows) {
      const qty = Number(r.quantity || 0);
      const cost = Number(r.unit_cost || 0);
      const value = Math.abs(qty) * cost;
      
      if (r.event_type === 'OPEN_BALANCE' || r.event_type === 'BATCH_RECEIPT' || r.event_type === 'ADJUSTMENT_IN') {
        incoming += qty;
        incomingValue += value;
      } else {
        outgoing += Math.abs(qty);
        outgoingValue += value;
      }
      
      // Calculate value at specific date if provided
      if (valueDate && r.movement_date <= valueDate) {
        if (r.event_type === 'OPEN_BALANCE' || r.event_type === 'BATCH_RECEIPT' || r.event_type === 'ADJUSTMENT_IN') {
          historicalValue += value;
        } else {
          historicalValue -= value;
        }
      }
    }
    
    return { 
      incoming, 
      outgoing, 
      net: incoming - outgoing,
      incomingValue,
      outgoingValue,
      netValue: incomingValue - outgoingValue,
      historicalValue: valueDate ? historicalValue : null
    };
  }, [rows, valueDate]);

  return (
    <div className="space-y-4">
      {/* Batch Context */}
      {batchInfo && (
        <GlassCard>
          <GlassCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Batch: {batchInfo.batch_number}
                </h3>
                <p className="text-sm text-white/70">
                  {batchInfo.inventory_products?.part_number} - {batchInfo.inventory_products?.description}
                </p>
                <p className="text-xs text-white/60">
                  Original Qty: {batchInfo.quantity} @ ${Number(batchInfo.cost_per_unit || 0).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-white/60">Received</div>
                <div className="text-white">
                  {batchInfo.received_date ? format(new Date(batchInfo.received_date), 'MMM dd, yyyy') : 'N/A'}
                </div>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Movement Analysis
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          {/* Date Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-white/70">From Date</Label>
              <Input 
                type="date" 
                value={from} 
                onChange={(e) => setFrom(e.target.value)} 
                className="bg-white/5 border-white/10 text-white" 
              />
            </div>
            <div>
              <Label className="text-white/70">To Date</Label>
              <Input 
                type="date" 
                value={to} 
                onChange={(e) => setTo(e.target.value)} 
                className="bg-white/5 border-white/10 text-white" 
              />
            </div>
            <div>
              <Label className="text-white/70">Value at Date</Label>
              <Input 
                type="date" 
                value={valueDate} 
                onChange={(e) => setValueDate(e.target.value)} 
                className="bg-white/5 border-white/10 text-white" 
                placeholder="Historical value" 
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setFrom('');
                  setTo('');
                  setValueDate('');
                }}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Quantity Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">Incoming</span>
              </div>
              <div className="text-xl font-bold text-green-300">{summary.incoming}</div>
              <div className="text-sm text-green-400">
                ${summary.incomingValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">Outgoing</span>
              </div>
              <div className="text-xl font-bold text-red-300">{summary.outgoing}</div>
              <div className="text-sm text-red-400">
                ${summary.outgoingValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-400">Net Position</span>
              </div>
              <div className="text-xl font-bold text-blue-300">{summary.net}</div>
              <div className="text-sm text-blue-400">
                ${summary.netValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Historical Value */}
          {summary.historicalValue !== null && (
            <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-400">
                  Value on {format(new Date(valueDate), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="text-2xl font-bold text-purple-300">
                ${summary.historicalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {/* Transaction Details */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Transaction History</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {isLoading ? (
            <div className="text-white/60 text-center py-8">Loading transactions...</div>
          ) : rows.length === 0 ? (
            <div className="text-white/60 text-center py-8">No transactions found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2">Date</th>
                    <th className="text-left py-3 px-2">Event Type</th>
                    <th className="text-right py-3 px-2">Quantity</th>
                    <th className="text-right py-3 px-2">Unit Cost</th>
                    <th className="text-right py-3 px-2">Value</th>
                    <th className="text-left py-3 px-2">Reference</th>
                    <th className="text-left py-3 px-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any, i: number) => {
                    const isIncoming = r.event_type === 'OPEN_BALANCE' || r.event_type === 'BATCH_RECEIPT' || r.event_type === 'ADJUSTMENT_IN';
                    const qty = Number(r.quantity || 0);
                    const cost = Number(r.unit_cost || 0);
                    const value = Math.abs(qty) * cost;
                    
                    return (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-2 text-white/90">
                          {r.movement_date ? format(new Date(r.movement_date), 'MMM dd, yyyy') : 'N/A'}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            isIncoming 
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}>
                            {r.event_type}
                          </span>
                        </td>
                        <td className={`py-3 px-2 text-right font-medium ${
                          isIncoming ? 'text-green-300' : 'text-red-300'
                        }`}>
                          {isIncoming ? '+' : ''}{qty}
                        </td>
                        <td className="py-3 px-2 text-right text-white/70">
                          ${cost.toFixed(2)}
                        </td>
                        <td className={`py-3 px-2 text-right font-medium ${
                          isIncoming ? 'text-green-300' : 'text-red-300'
                        }`}>
                          ${value.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-white/70 text-xs">
                          {r.reference_number || '-'}
                        </td>
                        <td className="py-3 px-2 text-white/60 text-xs max-w-32 truncate">
                          {r.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}


