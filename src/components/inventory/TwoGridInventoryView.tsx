import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Package, Calendar, DollarSign, Building2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface TwoGridInventoryViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProductWithStock {
  id: string;
  part_number: string;
  description: string;
  total_quantity: number;
  batch_count: number;
  unit_cost: number;
  reorder_point: number;
  minimum_stock: number;
  stock_category_name?: string;
}

interface BatchDetail {
  id: string;
  batch_number: string;
  quantity: number;
  cost_per_unit: number;
  received_date: string;
  expiry_date?: string;
  supplier_name?: string;
  location?: string;
  approval_status: string;
  serial_no?: string;
  status: string;
}

export function TwoGridInventoryView({ open, onOpenChange }: TwoGridInventoryViewProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Fetch products with stock summary
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['inventory-products-summary'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: allProducts } = await supabase
        .from('inventory_products')
        .select('*')
        .eq('user_id', user.id)
        .order('part_number');

      if (!allProducts) return [];

      // Get stock categories
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

          const totalStock = (product.open_balance || 0) + approvedStock;
          const batchCount = batches?.length || 0;

          const stockCategory = stockCategories?.find(cat => cat.id === product.stock_category);

          return {
            id: product.id,
            part_number: product.part_number,
            description: product.description,
            total_quantity: totalStock,
            batch_count: batchCount,
            unit_cost: product.unit_cost || 0,
            reorder_point: product.reorder_point || 0,
            minimum_stock: product.minimum_stock || 0,
            stock_category_name: stockCategory?.category_name || ''
          } as ProductWithStock;
        })
      );

      return productsWithStock;
    },
    enabled: !!user && open
  });

  // Fetch batches for selected product
  const { data: batches, isLoading: batchesLoading } = useQuery({
    queryKey: ['product-batches', selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return [];
      
      const { data, error } = await supabase
        .from('inventory_batches')
        .select(`
          *,
          suppliers (
            name
          )
        `)
        .eq('product_id', selectedProductId)
        .order('received_date', { ascending: false });

      if (error) throw error;

      return data.map(batch => ({
        id: batch.id,
        batch_number: batch.batch_number,
        quantity: batch.quantity,
        cost_per_unit: batch.cost_per_unit,
        received_date: batch.received_date,
        expiry_date: batch.expiry_date,
        supplier_name: batch.suppliers?.name,
        location: batch.location,
        approval_status: batch.approval_status,
        serial_no: batch.serial_no,
        status: batch.status
      })) as BatchDetail[];
    },
    enabled: !!selectedProductId && open
  });

  const filteredProducts = products?.filter(product =>
    product.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.stock_category_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const selectedProduct = products?.find(p => p.id === selectedProductId);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const isExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between w-full">
            <span className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Inventory Overview
            </span>
            {selectedProduct && (
              <span className="text-sm text-white/70">Total Stock: {selectedProduct.total_quantity}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left/Top Grid - Products */}
          <GlassCard className="flex flex-col">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center justify-between">
                <span>Stock Items</span>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="flex-1 overflow-hidden">
              {productsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto will-change-transform">
                  <Table>
                    <TableHeader className="sticky top-0 bg-surface-dark z-10">
                      <TableRow>
                        <TableHead>Part Number</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Batches</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow
                          key={product.id}
                          className={`cursor-pointer hover:bg-white/5 transition-colors ${
                            selectedProductId === product.id ? 'bg-blue-500/20' : ''
                          }`}
                          onClick={() => setSelectedProductId(product.id)}
                        >
                          <TableCell className="font-medium">{product.part_number}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={product.description}>
                            {product.description}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{product.total_quantity}</span>
                              {product.total_quantity <= product.minimum_stock && (
                                <AlertTriangle className="w-4 h-4 text-orange-400" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{product.batch_count}</TableCell>
                          <TableCell>
                            {product.total_quantity <= product.minimum_stock ? (
                              <Badge className="bg-orange-500">Low Stock</Badge>
                            ) : product.total_quantity <= product.reorder_point ? (
                              <Badge className="bg-yellow-500">Reorder</Badge>
                            ) : (
                              <Badge className="bg-green-500">Good</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>

          {/* Right/Bottom Grid - Batches */}
          <GlassCard className="flex flex-col">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center justify-between">
                <span>
                  {selectedProduct ? `Batches - ${selectedProduct.part_number}` : 'Select a Product'}
                </span>
                {selectedProduct && (
                  <div className="text-sm text-white/70">
                    Total Stock: {selectedProduct.total_quantity}
                  </div>
                )}
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="flex-1 overflow-hidden">
              {!selectedProductId ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/60">Select a product to view its batches</p>
                  </div>
                </div>
              ) : batchesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto will-change-transform">
                  <Table>
                    <TableHeader className="sticky top-0 bg-surface-dark z-10">
                      <TableRow>
                        <TableHead>Batch #</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batches?.map((batch) => (
                        <TableRow key={batch.id} className="hover:bg-white/5">
                          <TableCell className="font-medium">{batch.batch_number}</TableCell>
                          <TableCell>{batch.quantity}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {batch.cost_per_unit?.toFixed(2) || '0.00'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {batch.received_date ? format(new Date(batch.received_date), 'MM/dd/yy') : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {batch.location || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge className={getStatusBadgeColor(batch.approval_status)}>
                                {batch.approval_status}
                              </Badge>
                              {batch.expiry_date && (
                                <div className="text-xs">
                                  {isExpired(batch.expiry_date) ? (
                                    <Badge className="bg-red-500">Expired</Badge>
                                  ) : isExpiringSoon(batch.expiry_date) ? (
                                    <Badge className="bg-orange-500">Expiring Soon</Badge>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )) || (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-white/60">
                            No batches found for this product
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        </div>
      </DialogContent>
    </Dialog>
  );
}