
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { UserMenu } from '@/components/navigation/UserMenu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, BarChart3, Plus, TrendingUp, AlertTriangle, DollarSign, ArrowLeft, Send } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductsList } from '@/components/inventory/ProductsList';
import { BatchesList } from '@/components/inventory/BatchesList';
import { InventoryAnalytics } from '@/components/inventory/InventoryAnalytics';
import { AddProductDialog } from '@/components/inventory/AddProductDialog';
import { AddBatchDialog } from '@/components/inventory/AddBatchDialog';
import { TwoGridInventoryView } from '@/components/inventory/TwoGridInventoryView';
import { InventoryMovementSummary } from '@/components/inventory/InventoryMovementSummary';

const Inventory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addBatchOpen, setAddBatchOpen] = useState(false);
  const [inventoryGridOpen, setInventoryGridOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Fetch inventory stats
  const { data: inventoryStats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      if (!user) return null;
      
      // Load products (basic fields used for thresholds and open balance)
      const { data: products } = await supabase
        .from('inventory_products')
        .select('id, reorder_point, minimum_stock, open_balance');

      // Load all batches we need once
      const { data: batches } = await supabase
        .from('inventory_batches')
        .select('product_id, quantity, approval_status, cost_per_unit, status');

      const batchesByProduct = new Map<string, { approvedQty: number }>();
      let totalStockValue = 0;
      let activeBatchesCount = 0;
      for (const b of batches || []) {
        if (b.status === 'active') activeBatchesCount += 1;
        const entry = batchesByProduct.get(b.product_id as any) || { approvedQty: 0 };
        if (b.approval_status === 'approved') {
          entry.approvedQty += Number(b.quantity || 0);
          if (b.cost_per_unit != null) {
            totalStockValue += Number(b.quantity || 0) * Number(b.cost_per_unit || 0);
          }
        }
        batchesByProduct.set(b.product_id as any, entry);
      }

      const totalProducts = products?.length || 0;
      let totalStock = 0;
      let lowStockItems = 0;
      for (const p of products || []) {
        const approvedQty = batchesByProduct.get(p.id as any)?.approvedQty || 0;
        const open = Number(p.open_balance || 0);
        const totalQty = open + approvedQty;
        totalStock += totalQty;
        const reorder = Number((p as any).reorder_point || 0);
        if (totalQty <= reorder) lowStockItems += 1;
      }

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
              <button
                onClick={() => navigate(-1)}
                className="text-white/60 hover:text-white transition-colors flex items-center gap-2"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
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
              <GradientButton onClick={() => setInventoryGridOpen(true)} variant="outline" className="gap-2">
                <Package className="w-4 h-4" />
                Inventory Overview
              </GradientButton>
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
        {/* Movement Summary */}
        <div className="mb-8">
          <InventoryMovementSummary />
        </div>

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
            <TabsTrigger value="submit-batch" className="data-[state=active]:bg-white/10">
              Submit Batch
            </TabsTrigger>
            <TabsTrigger value="stock-movements" className="data-[state=active]:bg-white/10">
              Stock Movement & Valuation
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

          <TabsContent value="submit-batch">
            <div className="space-y-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Submit New Batch</h3>
                <p className="text-white/70 mb-6">Submit new batches for approval</p>
                <GradientButton onClick={() => setAddBatchOpen(true)} className="gap-2">
                  <Send className="w-4 h-4" />
                  Submit Batch
                </GradientButton>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stock-movements">
            <div className="space-y-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Stock Movement & Valuation</h3>
                <p className="text-white/70 mb-6">Track stock movements, calculate valuations, and generate comprehensive reports</p>
                <Link to="/stock-movements">
                  <GradientButton variant="outline" className="gap-2">
                    <BarChart3 className="w-4 h-4" />
                    View Stock Reports
                  </GradientButton>
                </Link>
              </div>
            </div>
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
      <TwoGridInventoryView 
        open={inventoryGridOpen}
        onOpenChange={setInventoryGridOpen}
      />
    </div>
  );
};

export default Inventory;
