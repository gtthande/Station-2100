
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type Supplier = Tables<'suppliers'>;

// Define warehouse type since it's not in the generated types yet
interface Warehouse {
  id: string;
  name: string;
  code: string;
  user_id: string;
  address?: string;
  city?: string;
  state?: string;
  is_active: boolean;
}

interface AddBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProductId?: string | null;
}

export const AddBatchDialog = ({ open, onOpenChange, selectedProductId }: AddBatchDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    batch_number: '',
    product_id: selectedProductId || '',
    warehouse_id: '',
    supplier_id: '',
    supplier_invoice_number: '',
    quantity: 0,
    cost_per_unit: 0,
    received_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    location: '',
    purchase_order: '',
    notes: '',
    url: ''
  });

  // Fetch warehouses using direct query with proper error handling
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        // Direct table query to warehouses
        const { data: warehouseData, error: warehouseError } = await (supabase as any)
          .from('warehouses')
          .select('id, name, code, user_id, address, city, state, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('name');
        
        if (warehouseError) {
          console.error('Warehouse query failed:', warehouseError);
          return [];
        }
        
        return (warehouseData as unknown as Warehouse[]) || [];
      } catch (error) {
        console.error('Failed to fetch warehouses:', error);
        return [];
      }
    },
    enabled: !!user,
  });

  // Fetch suppliers
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Supplier[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (selectedProductId) {
      setFormData(prev => ({ ...prev, product_id: selectedProductId }));
    }
  }, [selectedProductId]);

  const createBatchMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('inventory_batches')
        .insert({
          ...data,
          user_id: user.id,
          entered_by: user.id, // Automatically set the logged-in user as entered_by
          supplier_id: data.supplier_id || null,
          supplier_invoice_number: data.supplier_invoice_number || null,
          warehouse_id: data.warehouse_id || null,
          expiry_date: data.expiry_date || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Batch created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['inventory-batches'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      onOpenChange(false);
      setFormData({
        batch_number: '',
        product_id: selectedProductId || '',
        warehouse_id: '',
        supplier_id: '',
        supplier_invoice_number: '',
        quantity: 0,
        cost_per_unit: 0,
        received_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        location: '',
        purchase_order: '',
        notes: '',
        url: ''
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id) {
      toast({
        title: "Error",
        description: "Please select a product",
        variant: "destructive",
      });
      return;
    }
    if (!formData.supplier_id) {
      toast({
        title: "Error",
        description: "Please select a supplier",
        variant: "destructive",
      });
      return;
    }
    createBatchMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-dark border-white/20 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Batch</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="batch_number">Batch Number *</Label>
              <Input
                id="batch_number"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="supplier_id">Supplier *</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent className="bg-surface-dark border-white/20">
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id} className="text-white">
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="warehouse_id">Warehouse</Label>
              <Select
                value={formData.warehouse_id}
                onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent className="bg-surface-dark border-white/20">
                  {warehouses?.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id} className="text-white">
                      {warehouse.name} ({warehouse.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="supplier_invoice_number">Supplier Invoice Number</Label>
              <Input
                id="supplier_invoice_number"
                value={formData.supplier_invoice_number}
                onChange={(e) => setFormData({ ...formData, supplier_invoice_number: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Invoice number from supplier"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="cost_per_unit">Cost per Unit ($)</Label>
              <Input
                id="cost_per_unit"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost_per_unit}
                onChange={(e) => setFormData({ ...formData, cost_per_unit: parseFloat(e.target.value) || 0 })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="received_date">Received Date</Label>
              <Input
                id="received_date"
                type="date"
                value={formData.received_date}
                onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="expiry_date">Expiry Date</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Shelf, Bin, etc."
              />
            </div>
            
            <div>
              <Label htmlFor="purchase_order">Purchase Order</Label>
              <Input
                id="purchase_order"
                value={formData.purchase_order}
                onChange={(e) => setFormData({ ...formData, purchase_order: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="url">Documentation URL</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
              placeholder="Link to certificates, documentation, etc."
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createBatchMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {createBatchMutation.isPending ? 'Creating...' : 'Create Batch'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
