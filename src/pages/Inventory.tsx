
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { UserMenu } from '@/components/navigation/UserMenu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, BarChart3, Plus, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductsList } from '@/components/inventory/ProductsList';
import { BatchesList } from '@/components/inventory/BatchesList';
import { InventoryAnalytics } from '@/components/inventory/InventoryAnalytics';
import { AddProductDialog } from '@/components/inventory/AddProductDialog';
import { AddBatchDialog } from '@/components/inventory/AddBatchDialog';

const Inventory = () => {
  const { user } = useAuth();
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addBatchOpen, setAddBatchOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Fetch inventory stats
  const { data: inventoryStats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      if (!user) return null;
      
      // Get inventory summary
      const { data: products } = await supabase
        .rpc('get_inventory_summary');
      
      // Get approved batches with cost data
      const { data: approvedBatches } = await supabase
        .from('inventory_batches')
        .select('quantity, cost_per_unit')
        .eq('approval_status', 'approved')
        .not('cost_per_unit', 'is', null);
      
      // Get all active batches count
      const { data: activeBatches } = await supabase
        .from('inventory_batches')
        .select('id')
        .eq('status', 'active');

      const totalProducts = products?.length || 0;
      const totalStock = products?.reduce((sum, p) => sum + (p.total_quantity || 0), 0) || 0;
      const lowStockItems = products?.filter(p => (p.total_quantity || 0) <= (p.reorder_point || 0)).length || 0;
      const totalStockValue = approvedBatches?.reduce((sum, b) => sum + ((b.quantity || 0) * (b.cost_per_unit || 0)), 0) || 0;
      const activeBatchesCount = activeBatches?.length || 0;

      return {
        totalProducts,
        totalStock,
        lowStockItems,
        totalStockValue,
        activeBatchesCount
      };
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Header */}
      <div className="border-b border-white/10 bg-surface-dark/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-white/60 hover:text-white transition-colors">
                ← Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Package className="w-6 h-6" />
                  Inventory Management
                </h1>
                <p className="text-white/60">Manage parts, products, and stock levels</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <GradientButton onClick={() => setAddProductOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Product
              </GradientButton>
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <GlassCard>
            <GlassCardContent className="p-6 text-center">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{inventoryStats?.totalProducts || 0}</h3>
              <p className="text-white/70">Total Products</p>
            </GlassCardContent>
          </GlassCard>
          
          <GlassCard>
            <GlassCardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{inventoryStats?.totalStock || 0}</h3>
              <p className="text-white/70">Total Stock</p>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">${(inventoryStats?.totalStockValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <p className="text-white/70">Stock Value</p>
            </GlassCardContent>
          </GlassCard>
          
          <GlassCard>
            <GlassCardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{inventoryStats?.lowStockItems || 0}</h3>
              <p className="text-white/70">Low Stock Items</p>
            </GlassCardContent>
          </GlassCard>
          
          <GlassCard>
            <GlassCardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{inventoryStats?.activeBatchesCount || 0}</h3>
              <p className="text-white/70">Active Batches</p>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="products" className="data-[state=active]:bg-white/10">
              Products
            </TabsTrigger>
            <TabsTrigger value="batches" className="data-[state=active]:bg-white/10">
              Batches
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white/10">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ProductsList 
              onSelectProduct={setSelectedProductId}
              onAddBatch={() => setAddBatchOpen(true)}
            />
          </TabsContent>

          <TabsContent value="batches">
            <BatchesList selectedProductId={selectedProductId} />
          </TabsContent>

          <TabsContent value="analytics">
            <InventoryAnalytics />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <AddProductDialog 
        open={addProductOpen} 
        onOpenChange={setAddProductOpen} 
      />
      <AddBatchDialog 
        open={addBatchOpen} 
        onOpenChange={setAddBatchOpen}
        selectedProductId={selectedProductId}
      />
    </div>
  );
};

export default Inventory;
