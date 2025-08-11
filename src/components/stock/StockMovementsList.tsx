import { useState } from 'react';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useCurrency } from '@/hooks/useCurrency';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  ArrowDown, 
  ArrowUp, 
  Search, 
  FileBarChart,
  Plus,
  Minus,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface StockMovementsListProps {
  onExport?: () => void;
}

export function StockMovementsList({ onExport }: StockMovementsListProps) {
  const { stockMovements, isLoadingMovements } = useStockMovements();
  const { formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMovements = stockMovements.filter(movement =>
    movement.inventory_products?.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movement.inventory_products?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movement.source_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movement.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'OPEN_BALANCE':
        return <FileBarChart className="w-4 h-4" />;
      case 'BATCH_RECEIPT':
        return <ArrowDown className="w-4 h-4" />;
      case 'JOB_CARD_ISSUE':
        return <ArrowUp className="w-4 h-4" />;
      case 'ADJUSTMENT_IN':
        return <Plus className="w-4 h-4" />;
      case 'ADJUSTMENT_OUT':
        return <Minus className="w-4 h-4" />;
      default:
        return <RotateCcw className="w-4 h-4" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'OPEN_BALANCE':
        return 'bg-blue-500/20 text-blue-300';
      case 'BATCH_RECEIPT':
        return 'bg-green-500/20 text-green-300';
      case 'JOB_CARD_ISSUE':
        return 'bg-red-500/20 text-red-300';
      case 'ADJUSTMENT_IN':
        return 'bg-emerald-500/20 text-emerald-300';
      case 'ADJUSTMENT_OUT':
        return 'bg-orange-500/20 text-orange-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'OPEN_BALANCE':
        return 'Opening Balance';
      case 'BATCH_RECEIPT':
        return 'Batch Receipt';
      case 'JOB_CARD_ISSUE':
        return 'Job Card Issue';
      case 'ADJUSTMENT_IN':
        return 'Stock Increase';
      case 'ADJUSTMENT_OUT':
        return 'Stock Decrease';
      default:
        return eventType;
    }
  };

  if (isLoadingMovements) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading stock movements...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Stock Movements</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search movements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                Export CSV
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredMovements.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchTerm ? 'No movements match your search.' : 'No stock movements recorded yet.'}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="font-medium">
                      {format(new Date(movement.movement_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {movement.inventory_products?.part_number}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {movement.inventory_products?.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {movement.inventory_batches?.batch_number || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('flex items-center gap-1 w-fit', getEventColor(movement.event_type))}>
                        {getEventIcon(movement.event_type)}
                        {getEventLabel(movement.event_type)}
                      </Badge>
                    </TableCell>
                    <TableCell 
                      className={cn(
                        'text-right font-medium',
                        movement.quantity > 0 ? 'text-green-400' : 'text-red-400'
                      )}
                    >
                      {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(movement.unit_cost)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(movement.quantity * movement.unit_cost)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {movement.source_ref}
                    </TableCell>
                    <TableCell className="max-w-32">
                      <div className="truncate" title={movement.notes || ''}>
                        {movement.notes || '-'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}