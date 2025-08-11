import { useState, useEffect } from 'react';
import { useStockMovements, BatchBreakdown } from '@/hooks/useStockMovements';
import { useCurrency } from '@/hooks/useCurrency';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  CalendarIcon,
  Download,
  Package
} from 'lucide-react';
import { format } from 'date-fns';

export function BatchBreakdownReport() {
  const { user } = useAuth();
  const { getBatchBreakdown } = useStockMovements();
  const { formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [breakdownData, setBreakdownData] = useState<BatchBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch products for filter
  const { data: products = [] } = useQuery({
    queryKey: ['inventory-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('inventory_products')
        .select('id, part_number, description')
        .eq('user_id', user.id)
        .order('part_number');
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    loadBreakdownData();
  }, [asOfDate, selectedProductId]);

  const loadBreakdownData = async () => {
    setIsLoading(true);
    try {
      const data = await getBatchBreakdown(
        selectedProductId || undefined,
        asOfDate.toISOString().split('T')[0]
      );
      setBreakdownData(data);
    } catch (error) {
      console.error('Failed to load batch breakdown data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = breakdownData.filter(item =>
    item.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.batch_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = filteredData.reduce((sum, item) => sum + item.total_value, 0);
  const totalQuantity = filteredData.reduce((sum, item) => sum + item.quantity_on_hand, 0);

  const exportToCsv = () => {
    const headers = ['Part Number', 'Batch Number', 'Quantity on Hand', 'Weighted Avg Cost', 'Total Value', 'Date Received'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        `"${item.part_number}"`,
        `"${item.batch_number}"`,
        item.quantity_on_hand,
        item.weighted_avg_cost,
        item.total_value,
        `"${format(new Date(item.date_received), 'yyyy-MM-dd')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `batch-breakdown-${format(asOfDate, 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-primary" />
            <CardTitle>Batch Breakdown Report</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <Select 
              value={selectedProductId} 
              onValueChange={setSelectedProductId}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All products</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.part_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search batches..."
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
            <Button variant="outline" onClick={exportToCsv} disabled={filteredData.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            Loading batch breakdown data...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchTerm ? 'No batches match your search.' : 'No batch breakdown data available.'}
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Total Batches</div>
                  <div className="text-2xl font-bold">{filteredData.length}</div>
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Date Received</TableHead>
                    <TableHead className="text-right">Quantity on Hand</TableHead>
                    <TableHead className="text-right">Weighted Avg Cost</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={`${item.product_id}-${item.batch_id}`}>
                      <TableCell className="font-medium">
                        {item.part_number}
                      </TableCell>
                      <TableCell>
                        {item.batch_number}
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.date_received), 'MMM dd, yyyy')}
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
                    <TableCell colSpan={3} className="font-medium">
                      Total ({filteredData.length} batches)
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
          </>
        )}
      </CardContent>
    </Card>
  );
}