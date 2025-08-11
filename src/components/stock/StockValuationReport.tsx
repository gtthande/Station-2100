import { useState, useEffect } from 'react';
import { useStockMovements, StockValuation } from '@/hooks/useStockMovements';
import { useCurrency } from '@/hooks/useCurrency';
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
  Search, 
  CalendarIcon,
  Download,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function StockValuationReport() {
  const { getStockValuation } = useStockMovements();
  const { formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const [valuationData, setValuationData] = useState<StockValuation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadValuationData();
  }, [asOfDate]);

  const loadValuationData = async () => {
    setIsLoading(true);
    try {
      const data = await getStockValuation(asOfDate.toISOString().split('T')[0]);
      setValuationData(data);
    } catch (error) {
      console.error('Failed to load valuation data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = valuationData.filter(item =>
    item.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = filteredData.reduce((sum, item) => sum + item.total_value, 0);
  const totalQuantity = filteredData.reduce((sum, item) => sum + item.quantity_on_hand, 0);

  const exportToCsv = () => {
    const headers = ['Part Number', 'Description', 'Quantity on Hand', 'Weighted Avg Cost', 'Total Value'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
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
            Loading valuation data...
          </div>
        ) : filteredData.length === 0 ? (
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
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity on Hand</TableHead>
                    <TableHead className="text-right">Weighted Avg Cost</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
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
                      Total ({filteredData.length} products)
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