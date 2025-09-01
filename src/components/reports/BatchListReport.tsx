import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Printer, List, Search, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface BatchListItem {
  id: string;
  batch_number: string;
  quantity: number;
  cost_per_unit: number | null;
  location: string | null;
  status: string | null;
  approval_status: string | null;
  created_at: string;
  received_date: string | null;
  expiry_date: string | null;
  inventory_products: {
    part_number: string;
    description: string;
    unit_of_measure: string;
  } | null;
  suppliers: {
    name: string;
  } | null;
}

export const BatchListReport = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');

  const { data: batches, isLoading } = useQuery({
    queryKey: ['batch-list-report', user?.id],
    queryFn: async () => {
      // Fetch all batches in pages to avoid default 1000 row cap
      const pageSize = 1000;
      let from = 0;
      const out: any[] = [];
      for (;;) {
        const to = from + pageSize - 1;
        const { data, error } = await supabase
          .from('inventory_batches')
          .select(`
            id,
            batch_number,
            quantity,
            cost_per_unit,
            location,
            status,
            approval_status,
            created_at,
            received_date,
            expiry_date,
            inventory_products (
              part_number,
              description,
              unit_of_measure
            ),
            suppliers (
              name
            )
          `)
          .range(from, to)
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (data && data.length) out.push(...data);
        if (!data || data.length < pageSize) break;
        from += pageSize;
      }
      return out;
    },
    enabled: !!user,
  });

  const filteredBatches = batches?.filter(batch => {
    const term = (searchTerm || '').trim().toLowerCase();
    const isNumeric = /^\d+$/.test(term);
    // If user types digits (e.g., 0023/4275), search ONLY by batch number to avoid
    // accidental matches with product part numbers like 20023.
    const matchesSearch = !term || (
      isNumeric
        ? (batch.batch_number || '').toLowerCase().includes(term)
        : (
            (batch.batch_number || '').toLowerCase().includes(term) ||
            (batch.inventory_products?.part_number || '').toLowerCase().includes(term) ||
            (batch.inventory_products?.description || '').toLowerCase().includes(term) ||
            (batch.location || '').toLowerCase().includes(term) ||
            (batch.suppliers?.name || '').toLowerCase().includes(term)
          )
    );

    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
    const matchesApproval = approvalFilter === 'all' || batch.approval_status === approvalFilter;

    return matchesSearch && matchesStatus && matchesApproval;
  }) || [];

  const handlePrint = () => {
    window.print();
  };

  const handleExportToExcel = () => {
    if (!filteredBatches || filteredBatches.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(
      filteredBatches.map(batch => ({
        'Batch Number': batch.batch_number,
        'Part Number': batch.inventory_products?.part_number || '',
        'Description': batch.inventory_products?.description || '',
        'Quantity': batch.quantity,
        'Unit of Measure': batch.inventory_products?.unit_of_measure || '',
        'Cost Per Unit': batch.cost_per_unit ? `$${batch.cost_per_unit.toFixed(2)}` : 'N/A',
        'Total Value': batch.cost_per_unit ? `$${(batch.cost_per_unit * batch.quantity).toFixed(2)}` : 'N/A',
        'Location': batch.location || '',
        'Status': batch.status || '',
        'Approval Status': batch.approval_status || '',
        'Supplier': batch.suppliers?.name || '',
        'Created Date': format(new Date(batch.created_at), 'MMM dd, yyyy'),
        'Received Date': batch.received_date ? format(new Date(batch.received_date), 'MMM dd, yyyy') : 'N/A',
        'Expiry Date': batch.expiry_date ? format(new Date(batch.expiry_date), 'MMM dd, yyyy') : 'N/A',
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Batch List');
    
    const fileName = `Batch_List_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const totalValue = filteredBatches?.reduce((sum, batch) => {
    return sum + ((batch.cost_per_unit || 0) * batch.quantity);
  }, 0) || 0;

  const statusOptions = [...new Set(batches?.map(b => b.status).filter(Boolean))];
  const approvalOptions = [...new Set(batches?.map(b => b.approval_status).filter(Boolean))];

  return (
    <>
      <GlassCard className="p-6 hover:bg-white/5 transition-colors cursor-pointer">
        <div onClick={() => setIsOpen(true)} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <List className="w-8 h-8 text-blue-400" />
              <div>
                <h3 className="text-xl font-semibold text-white">Batch List Report</h3>
                <p className="text-white/60">Complete batch inventory listing</p>
              </div>
            </div>
            {batches && batches.length > 0 && (
              <div className="text-right">
                <div className="text-lg font-semibold text-white">{batches.length}</div>
                <div className="text-sm text-white/60">Total Batches</div>
              </div>
            )}
          </div>
          <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
            Generate Batch List
          </Button>
        </div>
      </GlassCard>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden bg-surface-dark border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <List className="w-5 h-5" />
              Batch List Report - Complete Inventory
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 print:hidden">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                  <Input
                    placeholder="Search batches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-surface-dark border-white/20">
                  <SelectItem value="all" className="text-white">All Status</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status} className="text-white">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by approval" />
                </SelectTrigger>
                <SelectContent className="bg-surface-dark border-white/20">
                  <SelectItem value="all" className="text-white">All Approvals</SelectItem>
                  {approvalOptions.map((approval) => (
                    <SelectItem key={approval} value={approval} className="text-white">
                      {approval}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                <h1 className="text-2xl font-bold">BATCH LIST REPORT</h1>
                <p className="text-sm text-gray-600">Complete Batch Inventory Listing</p>
                <p className="text-sm text-gray-600">Generated on: {format(new Date(), 'MMMM dd, yyyy')}</p>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse text-white/60">Loading batch list...</div>
                </div>
              ) : !filteredBatches || filteredBatches.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/60 print:text-gray-600">No batches found matching criteria</p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="mb-6 p-4 bg-white/5 print:bg-gray-100 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-white/60 print:text-gray-600">Total Batches: </span>
                        <span className="font-semibold text-white print:text-black">{filteredBatches.length}</span>
                      </div>
                      <div>
                        <span className="text-white/60 print:text-gray-600">Total Value: </span>
                        <span className="font-semibold text-white print:text-black">${totalValue.toFixed(2)}</span>
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
                          <th className="text-left py-3 px-2 text-white/80 print:text-black font-semibold">Batch #</th>
                          <th className="text-left py-3 px-2 text-white/80 print:text-black font-semibold">Part Number</th>
                          <th className="text-left py-3 px-2 text-white/80 print:text-black font-semibold">Description</th>
                          <th className="text-right py-3 px-2 text-white/80 print:text-black font-semibold">Qty</th>
                          <th className="text-right py-3 px-2 text-white/80 print:text-black font-semibold">Unit Cost</th>
                          <th className="text-right py-3 px-2 text-white/80 print:text-black font-semibold">Total Value</th>
                          <th className="text-left py-3 px-2 text-white/80 print:text-black font-semibold">Location</th>
                          <th className="text-left py-3 px-2 text-white/80 print:text-black font-semibold">Status</th>
                          <th className="text-left py-3 px-2 text-white/80 print:text-black font-semibold">Approval</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBatches.map((batch, index) => {
                          const totalValue = (batch.cost_per_unit || 0) * batch.quantity;
                          
                          return (
                            <tr 
                              key={batch.id} 
                              className={`border-b border-white/5 print:border-gray-200 ${
                                index % 2 === 0 ? 'bg-white/5 print:bg-gray-50' : ''
                              }`}
                            >
                              <td className="py-3 px-2 text-white print:text-black font-medium">
                                {batch.batch_number}
                              </td>
                              <td className="py-3 px-2 text-white print:text-black">
                                {batch.inventory_products?.part_number || 'N/A'}
                              </td>
                              <td className="py-3 px-2 text-white/80 print:text-gray-700 max-w-xs truncate">
                                {batch.inventory_products?.description || 'N/A'}
                              </td>
                              <td className="py-3 px-2 text-right text-white print:text-black font-medium">
                                {batch.quantity}
                              </td>
                              <td className="py-3 px-2 text-right text-white/80 print:text-gray-700">
                                {batch.cost_per_unit ? `$${batch.cost_per_unit.toFixed(2)}` : 'N/A'}
                              </td>
                              <td className="py-3 px-2 text-right text-white print:text-black font-medium">
                                {batch.cost_per_unit ? `$${totalValue.toFixed(2)}` : 'N/A'}
                              </td>
                              <td className="py-3 px-2 text-white/80 print:text-gray-700">
                                {batch.location || 'N/A'}
                              </td>
                              <td className="py-3 px-2 text-white/80 print:text-gray-700">
                                {batch.status || 'N/A'}
                              </td>
                              <td className="py-3 px-2 text-white/80 print:text-gray-700">
                                {batch.approval_status || 'N/A'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-white/20 print:border-gray-400">
                          <td colSpan={5} className="py-3 px-2 text-right font-semibold text-white print:text-black">
                            Total Value:
                          </td>
                          <td className="py-3 px-2 text-right font-bold text-white print:text-black">
                            ${totalValue.toFixed(2)}
                          </td>
                          <td colSpan={3}></td>
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
                .print\\:border-gray-400 { border-color: #9ca3af !important; }
                .print\\:shadow-none { box-shadow: none !important; }
              }
            `}</style>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};