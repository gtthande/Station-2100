
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Plus, AlertTriangle, DollarSign, Building2 } from 'lucide-react';

// Define extended inventory summary type with new fields
interface ExtendedInventorySummary {
  id: string;
  user_id: string;
  part_number: string;
  description?: string;
  stock_category_name?: string;
  manufacturer?: string;
  unit_of_measure?: string;
  minimum_stock?: number;
  reorder_point?: number;
  unit_cost?: number;
  is_owner_supplied?: boolean;
  markup_percentage?: number;
  sale_price?: number;
  owner_cost_price?: number;
  calculated_sale_price?: number;
  total_quantity?: number;
  batch_count?: number;
  pending_quantity?: number;
  warehouse_distribution?: Array<{
    warehouse_id: string;
    warehouse_name: string;
    warehouse_code: string;
    quantity: number;
  }>;
  created_at?: string;
  updated_at?: string;
}

interface ProductsListProps {
  onSelectProduct: (productId: string) => void;
  onAddBatch: () => void;
}

export const ProductsList = ({ onSelectProduct, onAddBatch }: ProductsListProps) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: products, isLoading } = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('inventory_summary')
        .select('*')
        .order('part_number');
      
      if (error) throw error;
      return data as ExtendedInventorySummary[];
    },
    enabled: !!user,
  });

  const filteredProducts = products?.filter(product =>
    product.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.stock_category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleAddBatch = (productId: string) => {
    onSelectProduct(productId);
    onAddBatch();
  };

  if (isLoading) {
    return (
      <GlassCard>
        <GlassCardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading products...</p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <GlassCard>
        <GlassCardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
              <Input
                placeholder="Search products by name, part number, or stock category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <GlassCard>
          <GlassCardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Products Found</h3>
            <p className="text-white/60 mb-6">
              {searchTerm ? 'No products match your search criteria.' : 'Start by adding your first product to the inventory.'}
            </p>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <GlassCard key={product.id} className="hover:bg-white/5 transition-all duration-300">
              <GlassCardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <GlassCardTitle className="text-lg mb-1 flex items-center gap-2">
                      {product.part_number}
                      {product.is_owner_supplied && (
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                          Owner
                        </Badge>
                      )}
                    </GlassCardTitle>
                    <p className="text-sm text-white/60 mb-2">{product.description}</p>
                    {product.stock_category_name && (
                      <Badge variant="secondary" className="bg-white/10 text-white/80">
                        {product.stock_category_name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <GradientButton
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddBatch(product.id!)}
                      className="p-2"
                    >
                      <Plus className="w-4 h-4" />
                    </GradientButton>
                  </div>
                </div>
              </GlassCardHeader>
              <GlassCardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Total Stock:</span>
                    <span className="font-semibold text-white">{product.total_quantity || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Active Batches:</span>
                    <span className="font-semibold text-white">{product.batch_count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Min Stock:</span>
                    <span className="font-semibold text-white">{product.minimum_stock || 0}</span>
                  </div>
                  
                  {/* Pricing Information */}
                  <div className="border-t border-white/10 pt-3 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-medium text-green-300">Pricing</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/60">Unit Cost:</span>
                      <span className="text-sm text-white">${product.unit_cost?.toFixed(2) || '0.00'}</span>
                    </div>
                    
                    {product.is_owner_supplied ? (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/60">Owner Price:</span>
                        <span className="text-sm text-blue-300">${product.owner_cost_price?.toFixed(2) || '0.00'}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white/60">Markup:</span>
                          <span className="text-sm text-white">{product.markup_percentage?.toFixed(1) || '0.0'}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white/60">Sale Price:</span>
                          <span className="text-sm text-green-300">
                            ${product.sale_price?.toFixed(2) || product.calculated_sale_price?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Warehouse Distribution */}
                  {product.warehouse_distribution && product.warehouse_distribution.length > 0 && (
                    <div className="border-t border-white/10 pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-purple-300">Warehouses</span>
                      </div>
                      <div className="space-y-1">
                        {product.warehouse_distribution.map((warehouse: any) => (
                          <div key={warehouse.warehouse_id} className="flex justify-between items-center">
                            <span className="text-xs text-white/60">{warehouse.warehouse_code}:</span>
                            <span className="text-xs text-white">{warehouse.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {product.manufacturer && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/60">Manufacturer:</span>
                      <span className="text-sm text-white truncate ml-2">{product.manufacturer}</span>
                    </div>
                  )}
                  
                  {/* Low Stock Warning */}
                  {(product.total_quantity || 0) <= (product.minimum_stock || 0) && (
                    <div className="flex items-center gap-2 p-2 bg-orange-500/20 rounded-lg border border-orange-500/30">
                      <AlertTriangle className="w-4 h-4 text-orange-400" />
                      <span className="text-sm text-orange-300">Low Stock Alert</span>
                    </div>
                  )}
                </div>
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};
