
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export const InventoryAnalytics = () => {
  const { user } = useAuth();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['inventory-analytics'],
    queryFn: async () => {
      if (!user) return null;
      
      // Get inventory summary data
      const { data: summaryData } = await supabase
        .from('inventory_summary')
        .select('*');
      
      // Get batch data for analytics
      const { data: batchData } = await supabase
        .from('inventory_batches')
        .select(`
          *,
          inventory_products (
            category,
            part_number
          )
        `);
      
      return {
        summary: summaryData || [],
        batches: batchData || []
      };
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <GlassCard>
        <GlassCardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading analytics...</p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  if (!analytics || analytics.summary.length === 0) {
    return (
      <GlassCard>
        <GlassCardContent className="p-12 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
          <p className="text-white/60">Add some products and batches to see analytics.</p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  // Prepare data for charts
  const stockLevelsData = analytics.summary
    .slice(0, 10)
    .map(item => ({
      name: item.part_number?.substring(0, 15) + (item.part_number && item.part_number.length > 15 ? '...' : ''),
      stock: item.total_quantity || 0,
      minimum: item.minimum_stock || 0
    }));

  const categoryData = analytics.summary.reduce((acc: any[], item) => {
    const category = item.category || 'Uncategorized';
    const existing = acc.find(c => c.name === category);
    if (existing) {
      existing.value += item.total_quantity || 0;
      existing.count += 1;
    } else {
      acc.push({
        name: category,
        value: item.total_quantity || 0,
        count: 1
      });
    }
    return acc;
  }, []);

  const batchStatusData = analytics.batches.reduce((acc: any[], batch) => {
    const status = batch.status || 'active';
    const existing = acc.find(s => s.name === status);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({
        name: status,
        value: 1
      });
    }
    return acc;
  }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Levels Chart */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Stock Levels vs Minimum Stock</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockLevelsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                    stroke="rgba(255,255,255,0.3)"
                  />
                  <YAxis 
                    tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                    stroke="rgba(255,255,255,0.3)"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Bar dataKey="stock" fill="#3b82f6" name="Current Stock" />
                  <Bar dataKey="minimum" fill="#ef4444" name="Minimum Stock" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Category Distribution */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Stock by Category</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batch Status Distribution */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Batch Status Distribution</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={batchStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {batchStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Summary Stats */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Inventory Summary</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <h4 className="text-2xl font-bold text-white">{analytics.summary.length}</h4>
                <p className="text-white/60 text-sm">Total Products</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <h4 className="text-2xl font-bold text-white">{analytics.batches.length}</h4>
                <p className="text-white/60 text-sm">Total Batches</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <h4 className="text-2xl font-bold text-white">
                  {analytics.summary.reduce((sum, item) => sum + (item.total_quantity || 0), 0)}
                </h4>
                <p className="text-white/60 text-sm">Total Stock</p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <h4 className="text-2xl font-bold text-orange-300">
                  {analytics.summary.filter(item => 
                    (item.total_quantity || 0) <= (item.minimum_stock || 0)
                  ).length}
                </h4>
                <p className="text-white/60 text-sm">Low Stock</p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
};
