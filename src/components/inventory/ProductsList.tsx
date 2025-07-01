
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Plus, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type InventoryProduct = Tables<'inventory_products'>;
type InventorySummary = Tables<'inventory_summary'>;

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
        .order('name');
      
      if (error) throw error;
      return data as InventorySummary[];
    },
    enabled: !!user,
  });

  const filteredProducts = products?.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
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
                placeholder="Search products by name, part number, or category..."
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
                    <GlassCardTitle className="text-lg mb-1">{product.name}</GlassCardTitle>
                    <p className="text-sm text-white/60 mb-2">Part: {product.part_number}</p>
                    {product.category && (
                      <Badge variant="secondary" className="bg-white/10 text-white/80">
                        {product.category}
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
