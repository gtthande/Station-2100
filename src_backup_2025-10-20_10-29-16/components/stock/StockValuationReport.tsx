import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStockMovements, StockValuation, BatchBreakdown } from '@/hooks/useStockMovements';
import { useCurrency } from '@/hooks/useCurrency';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Search, 
  CalendarIcon,
  Download,
  Printer,
  TrendingUp,
  Package
} from 'lucide-react';
import { format } from 'date-fns';

type ValuationProps = {
  initialAsOfDate?: Date;
  initialProductId?: string;
  initialDepartmentId?: string;
  periodContext?: { fromDate: Date; toDate: Date; productId?: string; departmentId?: string };
};
export function StockValuationReport(props?: ValuationProps) {
  const { getStockValuation, getBatchBreakdown } = useStockMovements();
  const { formatCurrency } = useCurrency();

  const [searchTerm, setSearchTerm] = useState('');
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const [valuationData, setValuationData] = useState<StockValuation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Scope filtering
  const [scope, setScope] = useState<'all' | 'product' | 'department'>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');

  // Batch detail (optional) when product scope selected
  const [showBatchDetail, setShowBatchDetail] = useState(false);
  const [batchDetail, setBatchDetail] = useState<BatchBreakdown[]>([]);
  const [isLoadingBatch, setIsLoadingBatch] = useState(false);

  // Load reference data for filtering
  const { data: products = [] } = useQuery({
    queryKey: ['valuation-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_products')
        .select('id, part_number, description, department_id');
      if (error) throw error;
      return data as { id: string; part_number: string; description: string | null; department_id: string | null }[];
    },
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['valuation-departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, department_name');
      if (error) throw error;
      return data as { id: string; department_name: string }[];
    },
  });

  useEffect(() => {
    loadValuationData();
  }, [asOfDate]);

  const loadValuationData = async () => {
    setIsLoading(true);
    try {
      const data = await getStockValuation(asOfDate.toISOString().split('T')[0]); // treated as end-of-day
      setValuationData(data);
    } catch (error) {
      console.error('Failed to load valuation data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredByScope = useMemo(() => {
    if (scope === 'product' && selectedProductId) {
      return valuationData.filter(v => v.product_id === selectedProductId);
    }
    if (scope === 'department' && selectedDepartmentId) {
      const productIds = new Set(
        products.filter(p => p.department_id === selectedDepartmentId).map(p => p.id)
      );
      return valuationData.filter(v => productIds.has(v.product_id));
    }
    return valuationData;
  }, [valuationData, scope, selectedProductId, selectedDepartmentId, products]);

  const filteredSearch = filteredByScope.filter(item =>
    item.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = filteredSearch.reduce((sum, item) => sum + item.total_value, 0);
  const totalQuantity = filteredSearch.reduce((sum, item) => sum + item.quantity_on_hand, 0);

  // Print-friendly rendering
  const printReport = () => {
    const doc = window.open('', '_blank');
    if (!doc) return;
    const title = `Stock Valuation Report - ${format(asOfDate, 'yyyy-MM-dd')}`;
    const rowsHtml = filteredSearch.map((item) => `
      <tr>
        <td style="padding:6px;border-bottom:1px solid #eee;font-family:ui-sans-serif,system-ui">${item.part_number}</td>
        <td style="padding:6px;border-bottom:1px solid #eee;font-family:ui-sans-serif,system-ui">${item.description || ''}</td>
        <td style="padding:6px;border-bottom:1px solid #eee;text-align:right;font-family:ui-sans-serif,system-ui">${item.quantity_on_hand.toFixed(2)}</td>
        <td style="padding:6px;border-bottom:1px solid #eee;text-align:right;font-family:ui-sans-serif,system-ui">${formatCurrency(item.weighted_avg_cost)}</td>
        <td style="padding:6px;border-bottom:1px solid #eee;text-align:right;font-weight:600;font-family:ui-sans-serif,system-ui">${formatCurrency(item.total_value)}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            @media print { @page { size: A4 portrait; margin: 12mm; } }
            h1 { font-family: ui-sans-serif, system-ui; font-size: 18px; margin: 0 0 12px; }
            .meta { font-family: ui-sans-serif, system-ui; color: #555; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; padding: 6px; border-bottom: 1px solid #ccc; font-family: ui-sans-serif,system-ui }
            tfoot td { font-weight: 700; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="meta">Total Products: ${filteredSearch.length} | Total Qty: ${totalQuantity.toFixed(2)} | Total Value: ${formatCurrency(totalValue)}</div>
          <table>
            <thead>
              <tr>
                <th>Part Number</th>
                <th>Description</th>
                <th style="text-align:right">Qty On Hand</th>
                <th style="text-align:right">Weighted Avg Cost</th>
                <th style="text-align:right">Total Value</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2">Totals (${filteredSearch.length} products)</td>
                <td style="text-align:right">${totalQuantity.toFixed(2)}</td>
                <td></td>
                <td style="text-align:right">${formatCurrency(totalValue)}</td>
              </tr>
            </tfoot>
          </table>
          <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };</script>
        </body>
      </html>
    `;
    doc.document.write(html);
    doc.document.close();
  };

  const exportToCsv = () => {
    const headers = ['Part Number', 'Description', 'Quantity on Hand', 'Weighted Avg Cost', 'Total Value'];
    const csvContent = [
      headers.join(','),
      ...filteredSearch.map(item => [
        `"${item.part_number}"`,
        `"${item.description || ''}"`,
        item.quantity_on_hand,
        item.weighted_avg_cost,
        item.total_value
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-valuation-${format(asOfDate, 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleBatchDetail = async () => {
    if (scope !== 'product' || !selectedProductId) return;
    if (showBatchDetail) {
      setShowBatchDetail(false);
      return;
    }
    setIsLoadingBatch(true);
    try {
      const data = await getBatchBreakdown(selectedProductId, asOfDate.toISOString().split('T')[0]);
      setBatchDetail(data);
      setShowBatchDetail(true);
    } catch (e) {
      console.error('Failed to load batch breakdown', e);
    } finally {
      setIsLoadingBatch(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle>Stock Valuation Report</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-36">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(asOfDate, 'MMM dd, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={asOfDate}
                  onSelect={(date) => date && setAsOfDate(date)}
                  disabled={(date) =>
                    date > new Date() || date < new Date('1900-01-01')
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={exportToCsv} disabled={filteredSearch.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="secondary" onClick={printReport} disabled={filteredSearch.length === 0}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Scope selectors */}
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <Select value={scope} onValueChange={(v: any) => { setScope(v); setSelectedProductId(''); setSelectedDepartmentId(''); setShowBatchDetail(false); }}>
            <SelectTrigger>
              <SelectValue placeholder="Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              <SelectItem value="product">Single product</SelectItem>
              <SelectItem value="department">By department</SelectItem>
            </SelectContent>
          </Select>

          {scope === 'product' && (
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.part_number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {scope === 'department' && (
            <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.department_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Data */}
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            Loading valuation data...
          </div>
        ) : filteredSearch.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchTerm ? 'No products match your search.' : 'No stock valuation data available.'}
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Total Products</div>
                  <div className="text-2xl font-bold">{filteredSearch.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Total Quantity</div>
                  <div className="text-2xl font-bold">{totalQuantity.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Total Value</div>
                  <div className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Data Table */}
            <div className="rounded-md border mb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity on Hand</TableHead>
                    <TableHead className="text-right">Weighted Avg Cost</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSearch.map((item) => (
                    <TableRow key={item.product_id}>
                      <TableCell className="font-medium">
                        {item.part_number}
                      </TableCell>
                      <TableCell>
                        {item.description}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity_on_hand.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.weighted_avg_cost)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.total_value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-medium">
                      Total ({filteredSearch.length} products)
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {totalQuantity.toFixed(2)}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatCurrency(totalValue)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Optional batch detail when product scope */}
            {scope === 'product' && selectedProductId && (
              <div className="space-y-3">
                <Button variant="outline" onClick={toggleBatchDetail} disabled={isLoadingBatch}>
                  <Package className="w-4 h-4 mr-2" />
                  {showBatchDetail ? 'Hide Batch Detail' : 'Show Batch Detail'}
                </Button>
                {showBatchDetail && (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Batch Number</TableHead>
                          <TableHead>Date Received</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Weighted Avg Cost</TableHead>
                          <TableHead className="text-right">Total Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchDetail.map(b => (
                          <TableRow key={`${b.product_id}-${b.batch_id}`}>
                            <TableCell>{b.batch_number}</TableCell>
                            <TableCell>{format(new Date(b.date_received), 'yyyy-MM-dd')}</TableCell>
                            <TableCell className="text-right">{b.quantity_on_hand.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(b.weighted_avg_cost)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(b.total_value)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
