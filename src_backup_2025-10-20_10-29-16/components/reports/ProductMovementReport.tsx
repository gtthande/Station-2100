import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BackButton } from '@/components/navigation/BackButton';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Download, Printer, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface MovementData {
  status: string;
  count: number;
  percentage: number;
  totalValue: number;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6b7280', '#8b5cf6'];

const STATUS_LABELS = {
  'active': 'Active Batches',
  'pending': 'Pending Approval',
  'expired': 'Expired',
  'consumed': 'Consumed',
  'quarantined': 'Quarantined'
};

export const ProductMovementReport = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const { data: movementData, isLoading } = useQuery({
    queryKey: ['product-movement-report', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: batches } = await supabase
        .from('inventory_batches')
        .select('approval_status, status, quantity, cost_per_unit')
        .eq('user_id', user.id);

      if (!batches) return [];

      // Group by status
      const statusGroups: Record<string, { count: number; totalValue: number }> = {};
      let totalBatches = 0;
      let totalValueSum = 0;

      batches.forEach(batch => {
        const status = batch.approval_status === 'pending' ? 'pending' : (batch.status || 'active');
        const value = (batch.cost_per_unit || 0) * (batch.quantity || 0);
        
        if (!statusGroups[status]) {
          statusGroups[status] = { count: 0, totalValue: 0 };
        }
        
        statusGroups[status].count += 1;
        statusGroups[status].totalValue += value;
        totalBatches += 1;
        totalValueSum += value;
      });

      // Convert to chart data
      return Object.entries(statusGroups).map(([status, data]) => ({
        status,
        count: data.count,
        percentage: totalBatches > 0 ? (data.count / totalBatches) * 100 : 0,
        totalValue: data.totalValue
      }));
    },
    enabled: !!user?.id,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportToExcel = () => {
    if (!movementData || movementData.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(
      movementData.map(item => ({
        'Status': STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] || item.status,
        'Batch Count': item.count,
        'Percentage': `${item.percentage.toFixed(1)}%`,
        'Total Value': `$${item.totalValue.toFixed(2)}`,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Movement');
    
    const fileName = `Product_Movement_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const totalBatches = movementData?.reduce((sum, item) => sum + item.count, 0) || 0;
  const totalValue = movementData?.reduce((sum, item) => sum + item.totalValue, 0) || 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface-dark border border-white/20 p-3 rounded-lg">
          <p className="text-white font-medium">
            {STATUS_LABELS[data.status as keyof typeof STATUS_LABELS] || data.status}
          </p>
          <p className="text-white/70">Count: {data.count}</p>
          <p className="text-white/70">Percentage: {data.percentage.toFixed(1)}%</p>
          <p className="text-white/70">Value: ${data.totalValue.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <GlassCard className="p-6 hover:bg-white/5 transition-colors cursor-pointer">
        <div onClick={() => setIsOpen(true)} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-400" />
              <div>
                <h3 className="text-xl font-semibold text-white">Product Movement</h3>
                <p className="text-white/60">Batch distribution pie chart</p>
              </div>
            </div>
            {totalBatches > 0 && (
              <div className="text-right">
                <div className="text-lg font-semibold text-white">{totalBatches}</div>
                <div className="text-sm text-white/60">Total Batches</div>
              </div>
            )}
          </div>
          <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
            View Movement Chart
          </Button>
        </div>
      </GlassCard>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden bg-surface-dark border-white/10">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Product Movement Report - Batch Distribution
              </DialogTitle>
              <div className="hidden sm:block">
                <BackButton label="Back to Inventory" />
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto">
            {/* Actions */}
            <div className="flex gap-2 print:hidden">
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Print Report
              </Button>
              <Button onClick={handleExportToExcel} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>

            {/* Report Content */}
            <div className="p-4 print:shadow-none print:bg-white print:text-black">
              {/* Print Header */}
              <div className="hidden print:block mb-6 text-center border-b border-gray-300 pb-4">
                <h1 className="text-2xl font-bold">PRODUCT MOVEMENT REPORT</h1>
                <p className="text-sm text-gray-600">Batch Distribution Analysis</p>
                <p className="text-sm text-gray-600">Generated on: {format(new Date(), 'MMMM dd, yyyy')}</p>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse text-white/60">Loading movement data...</div>
                </div>
              ) : !movementData || movementData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/60 print:text-gray-600">No movement data available</p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="mb-6 p-4 bg-white/5 print:bg-gray-100 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-white/60 print:text-gray-600">Total Batches: </span>
                        <span className="font-semibold text-white print:text-black">{totalBatches}</span>
                      </div>
                      <div>
                        <span className="text-white/60 print:text-gray-600">Total Value: </span>
                        <span className="font-semibold text-white print:text-black">${totalValue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Chart and Table Container */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div className="bg-white/5 print:bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-white print:text-black mb-4">Distribution Chart</h3>
                      <div className="h-80 print:hidden">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={movementData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                              label={({ status, percentage }) => 
                                `${STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status}: ${percentage.toFixed(1)}%`
                              }
                            >
                              {movementData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Print version table */}
                      <div className="hidden print:block">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-300">
                              <th className="text-left py-2">Status</th>
                              <th className="text-right py-2">Count</th>
                              <th className="text-right py-2">%</th>
                            </tr>
                          </thead>
                          <tbody>
                            {movementData.map((item, index) => (
                              <tr key={index} className="border-b border-gray-200">
                                <td className="py-2">{STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] || item.status}</td>
                                <td className="text-right py-2">{item.count}</td>
                                <td className="text-right py-2">{item.percentage.toFixed(1)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white/5 print:bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-white print:text-black mb-4">Detailed Breakdown</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10 print:border-gray-300">
                              <th className="text-left py-3 text-white/80 print:text-black font-semibold">Status</th>
                              <th className="text-right py-3 text-white/80 print:text-black font-semibold">Count</th>
                              <th className="text-right py-3 text-white/80 print:text-black font-semibold">%</th>
                              <th className="text-right py-3 text-white/80 print:text-black font-semibold">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {movementData.map((item, index) => (
                              <tr 
                                key={index} 
                                className={`border-b border-white/5 print:border-gray-200 ${
                                  index % 2 === 0 ? 'bg-white/5 print:bg-gray-50' : ''
                                }`}
                              >
                                <td className="py-3 text-white print:text-black">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full print:hidden" 
                                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    {STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] || item.status}
                                  </div>
                                </td>
                                <td className="py-3 text-right text-white print:text-black font-medium">
                                  {item.count}
                                </td>
                                <td className="py-3 text-right text-white/80 print:text-gray-700">
                                  {item.percentage.toFixed(1)}%
                                </td>
                                <td className="py-3 text-right text-white print:text-black font-medium">
                                  ${item.totalValue.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Footer for print */}
                  <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Generated by Inventory Management System</span>
                      <span>Page 1 of 1</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Print Styles */}
            <style>{`
              @media print {
                body { -webkit-print-color-adjust: exact; }
                .print\\:hidden { display: none !important; }
                .print\\:block { display: block !important; }
                .print\\:bg-white { background-color: white !important; }
                .print\\:bg-gray-50 { background-color: #f9fafb !important; }
                .print\\:bg-gray-100 { background-color: #f3f4f6 !important; }
                .print\\:text-black { color: black !important; }
                .print\\:text-gray-600 { color: #6b7280 !important; }
                .print\\:text-gray-700 { color: #374151 !important; }
                .print\\:border-gray-200 { border-color: #e5e7eb !important; }
                .print\\:border-gray-300 { border-color: #d1d5db !important; }
                .print\\:shadow-none { box-shadow: none !important; }
              }
            `}</style>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};