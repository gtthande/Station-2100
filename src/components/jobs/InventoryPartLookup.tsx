import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InventoryBatch {
  id: string;
  batch_number: string;
  quantity: number;
  cost_per_unit?: number;
  selling_price?: number;
  expiry_date?: string;
  serial_no?: string;
  status: string;
  approval_status: string;
  inventory_products?: {
    id: string;
    part_number: string;
    description?: string;
    unit_of_measure?: string;
    stock_category?: string;
  };
}

interface InventoryPartLookupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPart: (part: {
    part_number: string;
    description: string;
    quantity: number;
    cost_price: number;
    batch_id: string;
    batch_number: string;
  }) => void;
  warehouseType: 'warehouse_a' | 'warehouse_bc' | 'owner_supplied';
}

export function InventoryPartLookup({ isOpen, onClose, onSelectPart, warehouseType }: InventoryPartLookupProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableBatches, setAvailableBatches] = useState<InventoryBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadAvailableBatches();
    }
  }, [isOpen, user]);

  const loadAvailableBatches = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('inventory_batches')
        .select(`
          id,
          batch_number,
          quantity,
          cost_per_unit,
          selling_price,
          expiry_date,
          serial_no,
          status,
          approval_status,
          inventory_products (
            id,
            part_number,
            description,
            unit_of_measure,
            stock_category
          )
        `)
        .eq('user_id', user.id)
        .eq('approval_status', 'approved')
        .eq('status', 'active')
        .is('job_allocated_to', null)
        .gt('quantity', 0);

      const { data, error } = await query;

      if (error) throw error;

      setAvailableBatches(data || []);
    } catch (error) {
      console.error('Error loading available batches:', error);
      toast({
        title: "Error",
        description: "Failed to load available inventory",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredBatches = availableBatches.filter(batch => {
    const searchLower = searchTerm.toLowerCase();
    return (
      batch.inventory_products?.part_number?.toLowerCase().includes(searchLower) ||
      batch.inventory_products?.description?.toLowerCase().includes(searchLower) ||
      batch.batch_number.toLowerCase().includes(searchLower) ||
      batch.serial_no?.toLowerCase().includes(searchLower)
    );
  });

  const handleSelectPart = (batch: InventoryBatch) => {
    onSelectPart({
      part_number: batch.inventory_products?.part_number || '',
      description: batch.inventory_products?.description || '',
      quantity: 1, // Default to 1, user can modify
      cost_price: batch.cost_per_unit || 0,
      batch_id: batch.id,
      batch_number: batch.batch_number
    });
    onClose();
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Select Inventory Part - {warehouseType === 'warehouse_a' ? 'Aircraft Spares' : 
                                   warehouseType === 'warehouse_bc' ? 'Consumables' : 'Owner Supplied'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by part number, description, batch number, or serial number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-input text-foreground"
            />
          </div>

          {/* Batch Table */}
          <div className="flex-1 overflow-auto border rounded-lg bg-background">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-foreground font-semibold">Part Number</TableHead>
                  <TableHead className="text-foreground font-semibold">Description</TableHead>
                  <TableHead className="text-foreground font-semibold">Batch Number</TableHead>
                  <TableHead className="text-foreground font-semibold">Serial No</TableHead>
                  <TableHead className="text-foreground font-semibold">Available Qty</TableHead>
                  <TableHead className="text-foreground font-semibold">Cost Price</TableHead>
                  <TableHead className="text-foreground font-semibold">Selling Price</TableHead>
                  <TableHead className="text-foreground font-semibold">Expiry Date</TableHead>
                  <TableHead className="text-foreground font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading available inventory...
                    </TableCell>
                  </TableRow>
                ) : filteredBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No matching inventory found' : 'No available inventory batches'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBatches.map((batch) => (
                    <TableRow key={batch.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">
                        {batch.inventory_products?.part_number}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-foreground">
                        {batch.inventory_products?.description || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-foreground">
                          {batch.batch_number}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-foreground">
                        {batch.serial_no || 'N/A'}
                      </TableCell>
                      <TableCell className="text-foreground">
                        <span className="font-semibold">{batch.quantity}</span>
                        <span className="text-muted-foreground ml-1">
                          {batch.inventory_products?.unit_of_measure || 'each'}
                        </span>
                      </TableCell>
                      <TableCell className="text-foreground font-medium">
                        ${(batch.cost_per_unit || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-foreground font-medium">
                        ${(batch.selling_price || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {batch.expiry_date ? (
                          <div className="flex items-center gap-1">
                            {isExpired(batch.expiry_date) ? (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            ) : isExpiringSoon(batch.expiry_date) ? (
                              <AlertCircle className="w-4 h-4 text-orange-500" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            <span className={
                              isExpired(batch.expiry_date) ? 'text-red-600' :
                              isExpiringSoon(batch.expiry_date) ? 'text-orange-600' :
                              'text-gray-600'
                            }>
                              {new Date(batch.expiry_date).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleSelectPart(batch)}
                          disabled={isExpired(batch.expiry_date)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}