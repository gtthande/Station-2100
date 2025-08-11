import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/hooks/useCurrency';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { CalendarIcon, Download, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface MovementRow {
  id: string;
  movement_date: string; // yyyy-mm-dd
  quantity: number;
  unit_cost: number;
  source_ref: string;
  event_type: string;
  inventory_products?: { part_number: string; description: string | null } | null;
  inventory_batches?: { batch_number: string | null } | null;
}

type OpenValuationParams = { asOfDate: Date; productId?: string; departmentId?: string; fromDate: Date; toDate: Date; };

export function StockMovementReport({ onOpenValuation }: { onOpenValuation?: (p: OpenValuationParams) => void }) {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();

  const [fromDate, setFromDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [toDate, setToDate] = useState<Date>(new Date());
  const [productId, setProductId] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<MovementRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [totalCount, setTotalCount] = useState(0);

  // Load products
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
      return data as { id: string; part_number: string; description: string | null }[];
    },
    enabled: !!user?.id,
  });

  // Load departments
  const { data: departments = [] } = useQuery({
    queryKey: ['departments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('departments')
        .select('id, department_name')
        .eq('user_id', user.id)
        .order('department_name');
      if (error) throw error;
      return data as { id: string; department_name: string }[];
    },
    enabled: !!user?.id,
  });

  const runReport = async (targetPage = 1) => {
    if (!user?.id) return;
    if (fromDate > toDate) {
      toast.error('From date cannot be after To date');
      return;
    }
    setIsLoading(true);
    try {
      const from = format(fromDate, 'yyyy-MM-dd');
      const to = format(toDate, 'yyyy-MM-dd'); // inclusive end-of-day via DATE type

      const fromIndex = (targetPage - 1) * pageSize;
      const toIndex = fromIndex + pageSize - 1;

      let query = supabase
        .from('stock_movements')
        .select(`
          id,
          movement_date,
          quantity,
          unit_cost,
          source_ref,
          event_type,
          inventory_products(part_number, description),
          inventory_batches(batch_number)
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .gte('movement_date', from)
        .lte('movement_date', to)
        .order('movement_date', { ascending: true })
        .order('part_number', { ascending: true, foreignTable: 'inventory_products' })
        .range(fromIndex, toIndex);

      if (productId) query = query.eq('product_id', productId);
      if (departmentId) query = query.eq('department_id', departmentId);

      const { data, error, count } = await query;
      if (error) throw error;

      setRows((data || []) as MovementRow[]);
      setTotalCount(count || 0);
      setPage(targetPage);
    } catch (err) {
      console.error('Failed to load stock movement report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      (r.inventory_products?.part_number || '').toLowerCase().includes(q) ||
      (r.inventory_products?.description || '').toLowerCase().includes(q) ||
      (r.inventory_batches?.batch_number || '').toLowerCase().includes(q) ||
      r.source_ref.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const totals = useMemo(() => {
    const quantity = filtered.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
    const value = filtered.reduce((sum, r) => sum + Number(r.quantity || 0) * Number(r.unit_cost || 0), 0);
    return { quantity, value };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const exportCsv = async () => {
    if (!user?.id) return;
    const from = format(fromDate, 'yyyy-MM-dd');
    const to = format(toDate, 'yyyy-MM-dd');

    let query = supabase
      .from('stock_movements')
      .select(`
        id,
        movement_date,
        quantity,
        unit_cost,
        source_ref,
        event_type,
        inventory_products(part_number, description),
        inventory_batches(batch_number)
      `)
      .eq('user_id', user.id)
      .gte('movement_date', from)
      .lte('movement_date', to)
      .order('movement_date', { ascending: true })
      .order('part_number', { ascending: true, foreignTable: 'inventory_products' });

    if (productId) query = query.eq('product_id', productId);
    if (departmentId) query = query.eq('department_id', departmentId);

    const { data, error } = await query;
    if (error) {
      console.error('Failed to export stock movement report:', error);
      return;
    }

    const allRows = (data || []) as MovementRow[];
    const headers = ['Date','Part Number','Description','Batch','Event','Quantity','Unit Cost','Line Value','Source Ref'];
    const csv = [
      headers.join(','),
      ...allRows.map((r) => [
        `"${format(new Date(r.movement_date), 'yyyy-MM-dd')}"`,
        `"${r.inventory_products?.part_number || ''}"`,
        `"${r.inventory_products?.description || ''}"`,
        `"${r.inventory_batches?.batch_number || ''}"`,
        `"${r.event_type}"`,
        r.quantity,
        r.unit_cost,
        Number(r.quantity) * Number(r.unit_cost),
        `"${r.source_ref}"`,
      ].join(',')),
    ].join('\n');

    const totalQty = allRows.reduce((s, r) => s + Number(r.quantity || 0), 0);
    const totalVal = allRows.reduce((s, r) => s + Number(r.quantity || 0) * Number(r.unit_cost || 0), 0);
    const csvWithTotals = csv + `\nTOTAL,,,,,${totalQty},,${totalVal},`;

    const blob = new Blob([csvWithTotals], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-movements-${format(fromDate, 'yyyy-MM-dd')}_to_${format(toDate, 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-primary" />
            <CardTitle>Stock Movement Report</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-9 w-64" />
            </div>
            <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}> 
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-4 gap-3 mb-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                From: {format(fromDate, 'MMM dd, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={fromDate} onSelect={(d) => d && setFromDate(d)} initialFocus />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                To: {format(toDate, 'MMM dd, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={toDate} onSelect={(d) => d && setToDate(d)} initialFocus />
            </PopoverContent>
          </Popover>

          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger>
              <SelectValue placeholder="All products" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All products</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.part_number}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={departmentId} onValueChange={setDepartmentId}>
            <SelectTrigger>
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.department_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3 mb-4">
          <Button onClick={() => runReport(1)} disabled={isLoading}>{isLoading ? 'Loading...' : 'Run Report'}</Button>
          <Button variant="secondary" onClick={() => onOpenValuation?.({ asOfDate: toDate, productId: productId || undefined, departmentId: departmentId || undefined, fromDate, toDate })}>
            Total Stock
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Part Number / Description</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Event</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Line Value</TableHead>
                <TableHead>Source Ref</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{format(new Date(r.movement_date), 'yyyy-MM-dd')}</TableCell>
                  <TableCell>
                    <div className="font-medium">{r.inventory_products?.part_number}</div>
                    <div className="text-xs text-muted-foreground">{r.inventory_products?.description}</div>
                  </TableCell>
                  <TableCell>{r.inventory_batches?.batch_number || '-'}</TableCell>
                  <TableCell>{r.event_type}</TableCell>
                  <TableCell className={"text-right " + (Number(r.quantity) >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {Number(r.quantity) >= 0 ? '+' : ''}{r.quantity}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(r.unit_cost)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(Number(r.quantity) * Number(r.unit_cost))}</TableCell>
                  <TableCell className="font-mono text-xs">{r.source_ref}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-medium">Totals</TableCell>
                <TableCell className="text-right font-bold">{totals.quantity.toFixed(2)}</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(totals.value)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" className={page <= 1 ? 'pointer-events-none opacity-50' : ''} onClick={(e) => { e.preventDefault(); if (page > 1) runReport(page - 1); }} />
              </PaginationItem>
              <span className="px-3 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <PaginationItem>
                <PaginationNext href="#" className={page >= totalPages ? 'pointer-events-none opacity-50' : ''} onClick={(e) => { e.preventDefault(); if (page < totalPages) runReport(page + 1); }} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>
  );
}
