import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface LowStockItem {
  id: string;
  part_number: string;
  description: string;
  stock_category_name: string;
  total_quantity: number;
  minimum_stock: number;
  reorder_point: number;
  reorder_qty: number;
  unit_cost: number;
  unit_of_measure: string;
  department_name: string;
}

const ReorderReport = () => {
  const { user } = useAuth();

  const { data: lowStockItems, isLoading } = useQuery({
    queryKey: ['low-stock-items', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Get products and calculate actual stock
      const { data: products } = await supabase
        .from('inventory_products')
        .select('*')
        .eq('user_id', user.id)
        .not('reorder_qty', 'is', null)
        .gt('reorder_qty', 0);

      if (!products) return [];

      // Get stock categories separately
      const { data: stockCategories } = await supabase
        .from('stock_categories')
        .select('*')
        .eq('user_id', user.id);

      // Calculate current stock for each product
      const lowStockItems = await Promise.all(
        products.map(async (product) => {
          const { data: batches } = await supabase
            .from('inventory_batches')
            .select('quantity')
            .eq('product_id', product.id)
            .eq('approval_status', 'approved');

          const batchStock = batches?.reduce((sum, batch) => sum + (batch.quantity || 0), 0) || 0;
          const totalStock = (product.open_balance || 0) + batchStock;

          // Find stock category name
          const stockCategory = stockCategories?.find(cat => cat.id === product.stock_category);

          // Return only if below reorder quantity
          if (totalStock < (product.reorder_qty || 0)) {
            return {
              id: product.id,
              part_number: product.part_number,
              description: product.description || '',
              stock_category_name: stockCategory?.category_name || '',
              total_quantity: totalStock,
              minimum_stock: product.minimum_stock || 0,
              reorder_point: product.reorder_point || 0,
              reorder_qty: product.reorder_qty || 0,
              unit_cost: product.unit_cost || 0,
              unit_of_measure: product.unit_of_measure || 'each',
              department_name: ''
            };
          }
          return null;
        })
      );

      return lowStockItems.filter(item => item !== null) as LowStockItem[];
    },
    enabled: !!user?.id,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportToExcel = () => {
    if (!lowStockItems || lowStockItems.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(
      lowStockItems.map(item => ({
        'Part Number': item.part_number,
        'Description': item.description,
        'Category': item.stock_category_name || 'N/A',
        'Department': item.department_name || 'N/A',
        'Current Stock': item.total_quantity || 0,
        'Minimum Stock': item.minimum_stock || 0,
        'Reorder Point': item.reorder_point || 0,
        'Suggested Reorder Qty': item.reorder_qty || 0,
        'Unit Cost': item.unit_cost ? `$${parseFloat(item.unit_cost.toString()).toFixed(2)}` : 'N/A',
        'UOM': item.unit_of_measure || 'each',
        'Shortage': Math.max(0, (item.minimum_stock || 0) - (item.total_quantity || 0)),
        'Estimated Cost': item.unit_cost && item.reorder_qty ? 
          `$${(parseFloat(item.unit_cost.toString()) * (item.reorder_qty || 0)).toFixed(2)}` : 'N/A'
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reorder Report');
    
    const fileName = `Reorder_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse text-white/60">Loading reorder report...</div>
      </GlassCard>
    );
  }

  const totalEstimatedCost = lowStockItems?.reduce((sum, item) => {
    const cost = item.unit_cost && item.reorder_qty ? 
      parseFloat(item.unit_cost.toString()) * (item.reorder_qty || 0) : 0;
    return sum + cost;
  }, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header - Hide on print */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-white">Reorder Report</h2>
          <p className="text-white/60">Items below reorder quantity levels</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
          <Button onClick={handleExportToExcel} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Report Content */}
      <GlassCard className="p-6 print:shadow-none print:bg-white print:text-black">
        {/* Print Header */}
        <div className="hidden print:block mb-6 text-center border-b border-gray-300 pb-4">
          <h1 className="text-2xl font-bold">REORDER REPORT</h1>
          <p className="text-sm text-gray-600">Items Below Reorder Quantity Levels</p>
          <p className="text-sm text-gray-600">Generated on: {format(new Date(), 'MMMM dd, yyyy')}</p>
        </div>

        {!lowStockItems || lowStockItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/60 print:text-gray-600">No items below reorder quantity found</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="mb-6 p-4 bg-white/5 print:bg-gray-100 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-white/60 print:text-gray-600">Total Items: </span>
                  <span className="font-semibold text-white print:text-black">{lowStockItems.length}</span>
                </div>
                <div>
                  <span className="text-white/60 print:text-gray-600">Estimated Reorder Cost: </span>
                  <span className="font-semibold text-white print:text-black">${totalEstimatedCost.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-white/60 print:text-gray-600">Report Date: </span>
                  <span className="font-semibold text-white print:text-black">{format(new Date(), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 print:border-gray-300">
                    <th className="text-left py-3 px-2 text-white/80 print:text-black font-semibold">Part Number</th>
                    <th className="text-left py-3 px-2 text-white/80 print:text-black font-semibold">Description</th>
                    <th className="text-left py-3 px-2 text-white/80 print:text-black font-semibold">Category</th>
                    <th className="text-right py-3 px-2 text-white/80 print:text-black font-semibold">Current</th>
                    <th className="text-right py-3 px-2 text-white/80 print:text-black font-semibold">Reorder Qty</th>
                    <th className="text-right py-3 px-2 text-white/80 print:text-black font-semibold">Shortage</th>
                    <th className="text-right py-3 px-2 text-white/80 print:text-black font-semibold">Unit Cost</th>
                    <th className="text-right py-3 px-2 text-white/80 print:text-black font-semibold">Est. Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item, index) => {
                    const shortage = Math.max(0, (item.reorder_qty || 0) - (item.total_quantity || 0));
                    const estimatedCost = item.unit_cost && item.reorder_qty ? 
                      parseFloat(item.unit_cost.toString()) * (item.reorder_qty || 0) : 0;
                    
                    return (
                      <tr 
                        key={item.id} 
                        className={`border-b border-white/5 print:border-gray-200 ${
                          index % 2 === 0 ? 'bg-white/5 print:bg-gray-50' : ''
                        }`}
                      >
                        <td className="py-3 px-2 text-white print:text-black font-medium">{item.part_number}</td>
                        <td className="py-3 px-2 text-white/80 print:text-gray-700 max-w-xs truncate">
                          {item.description || 'N/A'}
                        </td>
                        <td className="py-3 px-2 text-white/80 print:text-gray-700">
                          {item.stock_category_name || 'N/A'}
                        </td>
                        <td className={`py-3 px-2 text-right font-medium ${
                          shortage > 0 ? 'text-red-400 print:text-red-600' : 'text-white print:text-black'
                        }`}>
                          {item.total_quantity || 0}
                        </td>
                        <td className="py-3 px-2 text-right text-white/80 print:text-gray-700">
                          {item.reorder_qty || 0}
                        </td>
                        <td className="py-3 px-2 text-right text-red-400 print:text-red-600 font-medium">
                          {shortage}
                        </td>
                        <td className="py-3 px-2 text-right text-white/80 print:text-gray-700">
                          {item.unit_cost ? `$${parseFloat(item.unit_cost.toString()).toFixed(2)}` : 'N/A'}
                        </td>
                        <td className="py-3 px-2 text-right font-medium text-white print:text-black">
                          {estimatedCost > 0 ? `$${estimatedCost.toFixed(2)}` : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-white/20 print:border-gray-400">
                    <td colSpan={7} className="py-3 px-2 text-right font-semibold text-white print:text-black">
                      Total Estimated Cost:
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-white print:text-black">
                      ${totalEstimatedCost.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
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
      </GlassCard>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:bg-white { background-color: white !important; }
          .print\\:text-black { color: black !important; }
          .print\\:text-gray-600 { color: #6b7280 !important; }
          .print\\:text-gray-700 { color: #374151 !important; }
          .print\\:text-red-600 { color: #dc2626 !important; }
          .print\\:bg-gray-50 { background-color: #f9fafb !important; }
          .print\\:bg-gray-100 { background-color: #f3f4f6 !important; }
          .print\\:border-gray-200 { border-color: #e5e7eb !important; }
          .print\\:border-gray-300 { border-color: #d1d5db !important; }
          .print\\:border-gray-400 { border-color: #9ca3af !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ReorderReport;
