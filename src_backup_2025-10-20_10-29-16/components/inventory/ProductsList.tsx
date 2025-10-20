
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Plus, AlertTriangle, DollarSign, Building2, Edit, Activity, CheckCircle } from 'lucide-react';
import { EditProductDialog } from './EditProductDialog';
import { ProductMovementDialog } from './ProductMovementDialog';
import { useToast } from '@/hooks/use-toast';

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
  reorder_qty?: number;
  unit_cost?: number;
  open_balance?: number;
  open_bal_date?: string;
  is_owner_supplied?: boolean;
  markup_percentage?: number;
  sale_price?: number;
  owner_cost_price?: number;
  calculated_sale_price?: number;
  total_quantity?: number;
  batch_count?: number;
  pending_quantity?: number;
  needs_reorder?: boolean;
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

interface EditState {
  isOpen: boolean;
  productId: string | null;
}

interface MovementState {
  isOpen: boolean;
  productId: string | null;
}

export const ProductsList = ({ onSelectProduct, onAddBatch }: ProductsListProps) => {
  const { user } = useAuth();
  const { isAdmin, isSupervisor, isPartsApprover } = useUserRoles();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [editState, setEditState] = useState<EditState>({ isOpen: false, productId: null });
  const [movementState, setMovementState] = useState<MovementState>({ isOpen: false, productId: null });

  const { data: products, isLoading } = useQuery({
    queryKey: ['inventory-products-with-stock'],
    queryFn: async () => {
      if (!user) return [];
      
      // Get all products first
      const { data: allProducts } = await supabase
        .from('inventory_products')
        .select('*')
        .eq('user_id', user.id)
        .order('part_number');

      if (!allProducts) return [];

      // Get stock categories separately
      const { data: stockCategories } = await supabase
        .from('stock_categories')
        .select('*')
        .eq('user_id', user.id);

      // Calculate stock for each product
      const productsWithStock = await Promise.all(
        allProducts.map(async (product) => {
          const { data: batches } = await supabase
            .from('inventory_batches')
            .select('quantity, approval_status')
            .eq('product_id', product.id);

          const approvedStock = batches
            ?.filter(b => b.approval_status === 'approved')
            ?.reduce((sum, b) => sum + (b.quantity || 0), 0) || 0;

          const pendingStock = batches
            ?.filter(b => b.approval_status === 'pending')
            ?.reduce((sum, b) => sum + (b.quantity || 0), 0) || 0;

          const totalStock = (product.open_balance || 0) + approvedStock;
          const batchCount = batches?.length || 0;

          // Find stock category name
          const stockCategory = stockCategories?.find(cat => cat.id === product.stock_category);

          return {
            ...product,
            total_quantity: totalStock,
            approved_stock: approvedStock,
            pending_quantity: pendingStock,
            batch_count: batchCount,
            stock_category_name: stockCategory?.category_name || '',
            is_low_stock: totalStock <= (product.minimum_stock || 0),
            needs_reorder: product.reorder_qty ? totalStock < product.reorder_qty : false,
            is_owner_supplied: false, // Add default values for missing fields
            markup_percentage: 0,
            sale_price: 0,
            owner_cost_price: 0,
            calculated_sale_price: 0,
            warehouse_distribution: [],
            manufacturer: ''
          } as ExtendedInventorySummary;
        })
      );

      return productsWithStock;
    },
    enabled: !!user,
  });

  // Get stock values for each product (opening balance + approved batches)
  const { data: stockValues } = useQuery({
    queryKey: ['product-stock-values'],
    queryFn: async () => {
      if (!user || !products?.length) return {};
      
      const productValues: { [key: string]: number } = {};
      
      // Calculate for each product
      for (const product of products) {
        // Opening balance value
        const openingValue = (product.open_balance || 0) * (product.unit_cost || 0);
        
        // Get approved batches value
        const { data: approvedBatches } = await supabase
          .from('inventory_batches')
          .select('quantity, cost_per_unit')
          .eq('product_id', product.id)
          .eq('approval_status', 'approved')
          .not('cost_per_unit', 'is', null);
        
        const batchesValue = approvedBatches?.reduce((sum, batch) => 
          sum + ((batch.quantity || 0) * (batch.cost_per_unit || 0)), 0) || 0;
        
        productValues[product.id!] = openingValue + batchesValue;
      }
      
      return productValues;
    },
    enabled: !!user && !!products?.length,
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

  const handleEditProduct = (productId: string) => {
    setEditState({ isOpen: true, productId });
  };

  const handleCloseEdit = () => {
    setEditState({ isOpen: false, productId: null });
  };

  const handleCloseMovement = () => {
    setMovementState({ isOpen: false, productId: null });
  };

  // Check if user can approve batches
  const canApproveBatches = isAdmin() || isSupervisor() || isPartsApprover();

  // Remove the bulk approval mutation as we're now using individual approvals

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
                      <button 
                        onClick={() => onSelectProduct(product.id!)}
                        className="text-left hover:text-blue-300 transition-colors"
                        title="Click to view batches"
                      >
                        {product.part_number}
                      </button>
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
                  <div className="flex gap-1">
                    <GradientButton
                      size="sm"
                      variant="outline"
                      onClick={() => setMovementState({ 
                        isOpen: true, 
                        productId: product.id!
                      })}
                      className="p-2"
                      title="View movement history and batches"
                    >
                      <Activity className="w-4 h-4" />
                    </GradientButton>
                    <GradientButton
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditProduct(product.id!)}
                      className="p-2"
                      title="Edit product"
                    >
                      <Edit className="w-4 h-4" />
                    </GradientButton>
                    <GradientButton
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddBatch(product.id!)}
                      className="p-2"
                      title="Add new batch"
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
                    <span className="text-sm text-white/60">Stock Value:</span>
                    <span className="font-semibold text-green-300">
                      ${((stockValues?.[product.id!] || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
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
                  
                  {/* Stock Alerts */}
                  {(product.total_quantity || 0) <= (product.minimum_stock || 0) && (
                    <div className="flex items-center gap-2 p-2 bg-orange-500/20 rounded-lg border border-orange-500/30">
                      <AlertTriangle className="w-4 h-4 text-orange-400" />
                      <span className="text-sm text-orange-300">Low Stock Alert</span>
                    </div>
                  )}
                  {product.needs_reorder && (
                    <div className="flex items-center gap-2 p-2 bg-red-500/20 rounded-lg border border-red-500/30">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-300">Needs Reorder</span>
                    </div>
                  )}
                  {(product.pending_quantity || 0) > 0 && (
                    <div className="p-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                      {canApproveBatches ? (
                        <button
                          onClick={() => setMovementState({ isOpen: true, productId: product.id! })}
                          disabled={false}
                          className="w-full flex items-center justify-between hover:bg-yellow-500/30 transition-colors rounded p-1 group"
                          title="Click to view and approve pending batches"
                        >
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm text-yellow-300">{product.pending_quantity} pending approval</span>
                          </div>
                          <div className="flex items-center gap-1 text-green-300 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs">View & approve</span>
                          </div>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-yellow-300">{product.pending_quantity} pending approval</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      )}
      
      <EditProductDialog
        open={editState.isOpen}
        onOpenChange={handleCloseEdit}
        productId={editState.productId}
      />
      
      <ProductMovementDialog
        open={movementState.isOpen}
        onOpenChange={handleCloseMovement}
        productId={movementState.productId}
        showApprovalActions={canApproveBatches}
      />
    </div>
  );
};
