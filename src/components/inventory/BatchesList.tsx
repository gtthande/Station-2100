import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package2, MapPin, Calendar, Truck, Building2, DollarSign } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';

// Extend the inventory batch type to include warehouse_id and relationships
type ExtendedInventoryBatch = Tables<'inventory_batches'> & {
  warehouse_id?: string;
  inventory_products?: {
    name: string;
    part_number: string;
  };
  suppliers?: {
    name: string;
  };
  warehouses?: {
    id: string;
    name: string;
    code: string;
  };
};

interface BatchesListProps {
  selectedProductId?: string | null;
}

export const BatchesList = ({ selectedProductId }: BatchesListProps) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: batches, isLoading } = useQuery({
    queryKey: ['inventory-batches', selectedProductId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('inventory_batches')
        .select(`
          *,
          inventory_products (
            name,
            part_number
          ),
          suppliers (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (selectedProductId) {
        query = query.eq('product_id', selectedProductId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;

      // Cast the data to our extended type and fetch warehouse data separately
      const extendedBatches = (data as unknown as ExtendedInventoryBatch[]) || [];
      
      const batchesWithWarehouses = await Promise.all(extendedBatches.map(async (batch) => {
        if (batch.warehouse_id) {
          try {
            const { data: warehouse, error: warehouseError } = await (supabase as any)
              .from('warehouses')
              .select('id, name, code')
              .eq('id', batch.warehouse_id)
              .single();
            
            if (!warehouseError && warehouse) {
              return { ...batch, warehouses: warehouse };
            }
          } catch (warehouseError) {
            console.log('Failed to fetch warehouse for batch:', batch.id);
          }
        }
        return batch;
      }));

      return batchesWithWarehouses;
    },
    enabled: !!user,
  });

  const filteredBatches = batches?.filter(batch =>
    batch.batch_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.inventory_products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.warehouses?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'expired':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'quarantined':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'consumed':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-white/10 text-white/80 border-white/20';
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-white/10 text-white/80 border-white/20';
    }
  };

  if (isLoading) {
    return (
      <GlassCard>
        <GlassCardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading batches...</p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <GlassCard>
        <GlassCardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
            <Input
              placeholder="Search batches by batch number, product, location, or warehouse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Batches List */}
      {filteredBatches.length === 0 ? (
        <GlassCard>
          <GlassCardContent className="p-12 text-center">
            <Package2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Batches Found</h3>
            <p className="text-white/60">
              {searchTerm ? 'No batches match your search criteria.' : 'No batches available for the selected criteria.'}
            </p>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBatches.map((batch) => (
            <GlassCard key={batch.id} className="hover:bg-white/5 transition-all duration-300">
              <GlassCardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <GlassCardTitle className="text-lg mb-1">
                      Batch: {batch.batch_number}
                    </GlassCardTitle>
                    <p className="text-sm text-white/60">
                      {batch.inventory_products?.name} ({batch.inventory_products?.part_number})
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge className={`${getStatusColor(batch.status || 'active')} border text-xs`}>
                      {batch.status || 'active'}
                    </Badge>
                    <Badge className={`${getApprovalStatusColor(batch.approval_status || 'pending')} border text-xs`}>
                      {batch.approval_status || 'pending'}
                    </Badge>
                  </div>
                </div>
              </GlassCardHeader>
              <GlassCardContent className="pt-0 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/60">Quantity:</span>
                  <span className="font-semibold text-white">{batch.quantity}</span>
                </div>
                
                {batch.warehouses && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-purple-300">
                      {batch.warehouses.name} ({batch.warehouses.code})
                    </span>
                  </div>
                )}
                
                {batch.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/80">{batch.location}</span>
                  </div>
                )}
                
                {batch.cost_per_unit && (
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white/60">Cost per unit:</span>
                    </div>
                    <span className="font-semibold text-green-300">${batch.cost_per_unit}</span>
                  </div>
                )}
                
                {batch.received_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/80">
                      Received: {format(new Date(batch.received_date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}
                
                {batch.expiry_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-orange-300">
                      Expires: {format(new Date(batch.expiry_date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}
                
                {batch.suppliers && (
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/80">{batch.suppliers.name}</span>
                  </div>
                )}
                
                {batch.purchase_order && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">PO:</span>
                    <span className="text-sm text-white/80">{batch.purchase_order}</span>
                  </div>
                )}

                {batch.url && (
                  <div className="pt-2">
                    <a 
                      href={batch.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 underline"
                    >
                      View Documentation
                    </a>
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};
