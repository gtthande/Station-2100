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
type Product = Pick<Tables<'inventory_products'>, 'id' | 'part_number' | 'description'>;

interface EditBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string | null;
  initialBatch?: any;
}

export const EditBatchDialog = ({ open, onOpenChange, batchId, initialBatch }: EditBatchDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    batch_number: '',
    product_id: '',
    supplier_id: '',
    supplier_invoice_number: '',
    quantity: 0,
    cost_per_unit: 0,
    received_date: '',
    expiry_date: '',
    location: '',
    purchase_order: '',
    notes: '',
    url: '',
    receipt_id: '',
    department_id: '',
    buying_price: 0,
    sale_markup_percent: 0,
    sale_markup_value: 0,
    selling_price: 0,
    lpo: '',
    reference_no: '',
    batch_date: '',
    bin_no: '',
    the_size: '',
    dollar_rate: 0,
    freight_rate: 0,
    total_rate: 0,
    dollar_amount: 0,
    core_value: 0,
    aircraft_reg_no: '',
    batch_id_a: '',
    batch_id_b: '',
    received_by: '',
    receive_code: '',
    verified_by: '',
    verification_code: '',
    core_id: '',
    serial_no: '',
    alternate_department_id: ''
  });

  // Fetch batch data
  const { data: batch } = useQuery({
    queryKey: ['batch', batchId],
    queryFn: async () => {
      if (!batchId || !user) return null;
      
      const { data, error } = await supabase
        .from('inventory_batches')
        .select('*')
        .eq('id', batchId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!batchId && !!user,
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

  // Fetch products for parent product selection
  const { data: products } = useQuery({
    queryKey: ['inventory-products-for-batch'],
    queryFn: async () => {
      if (!user) return [] as Product[];
      const { data, error } = await supabase
        .from('inventory_products')
        .select('id, part_number, description')
        .order('part_number');
      if (error) throw error;
      return (data || []) as Product[];
    },
    enabled: !!user,
  });

  // Update form when batch data loads (or initial batch passed from list)
  useEffect(() => {
    const source = batch || initialBatch;
    if (source) {
      setFormData({
        batch_number: source.batch_number || '',
        product_id: source.product_id || '',
        supplier_id: source.supplier_id || '',
        supplier_invoice_number: source.supplier_invoice_number || '',
        quantity: source.quantity || 0,
        cost_per_unit: source.cost_per_unit || 0,
        received_date: source.received_date || '',
        expiry_date: source.expiry_date || '',
        location: source.location || '',
        purchase_order: source.purchase_order || '',
        notes: source.notes || '',
        url: source.url || '',
        receipt_id: source.receipt_id || '',
        department_id: source.department_id || '',
        buying_price: source.buying_price || 0,
        sale_markup_percent: source.sale_markup_percent || 0,
        sale_markup_value: source.sale_markup_value || 0,
        selling_price: source.selling_price || 0,
        lpo: source.lpo || '',
        reference_no: source.reference_no || '',
        batch_date: source.batch_date || '',
        bin_no: source.bin_no || '',
        the_size: source.the_size || '',
        dollar_rate: source.dollar_rate || 0,
        freight_rate: source.freight_rate || 0,
        total_rate: source.total_rate || 0,
        dollar_amount: source.dollar_amount || 0,
        core_value: source.core_value || 0,
        aircraft_reg_no: source.aircraft_reg_no || '',
        batch_id_a: source.batch_id_a || '',
        batch_id_b: source.batch_id_b || '',
        received_by: source.received_by || '',
        receive_code: source.receive_code || '',
        verified_by: source.verified_by || '',
        verification_code: source.verification_code || '',
        core_id: source.core_id || '',
        serial_no: source.serial_no || '',
        alternate_department_id: source.alternate_department_id || ''
      });
    }
  }, [batch, initialBatch]);

  const updateBatchMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user || !batchId) throw new Error('User not authenticated or batch not selected');
      
      const batchData = {
        ...data,
        supplier_id: data.supplier_id || null,
        supplier_invoice_number: data.supplier_invoice_number || null,
        expiry_date: data.expiry_date || null,
        batch_date: data.batch_date || null,
        department_id: data.department_id || null,
        alternate_department_id: data.alternate_department_id || null,
      };

      const { error } = await supabase
        .from('inventory_batches')
        .update(batchData)
        .eq('id', batchId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Batch updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['inventory-batches'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
      onOpenChange(false);
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
        title: 'Missing Product',
        description: 'Please select the parent product for this batch.',
        variant: 'destructive'
      });
      return;
    }
    updateBatchMutation.mutate(formData);
  };

  if (!open || !batchId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-dark border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Batch</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <Label htmlFor="product_id">Parent Product *</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-dark border-white/20">
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id} className="text-white">
                        {product.part_number} — {product.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                <Label htmlFor="receipt_id">Receipt ID</Label>
                <Input
                  id="receipt_id"
                  value={formData.receipt_id}
                  onChange={(e) => setFormData({ ...formData, receipt_id: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="department_id">Department ID</Label>
                <Input
                  id="department_id"
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier_id">Supplier</Label>
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
            </div>
          </div>

          {/* Pricing Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Pricing Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cost_per_unit">Cost per Unit</Label>
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

              <div>
                <Label htmlFor="buying_price">Buying Price</Label>
                <Input
                  id="buying_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.buying_price}
                  onChange={(e) => setFormData({ ...formData, buying_price: parseFloat(e.target.value) || 0 })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="selling_price">Selling Price</Label>
                <Input
                  id="selling_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </div>

          {/* Location & Storage */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Location & Storage</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="bin_no">Bin Number</Label>
                <Input
                  id="bin_no"
                  value={formData.bin_no}
                  onChange={(e) => setFormData({ ...formData, bin_no: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="the_size">Size</Label>
                <Input
                  id="the_size"
                  value={formData.the_size}
                  onChange={(e) => setFormData({ ...formData, the_size: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Label htmlFor="batch_date">Batch Date</Label>
                <Input
                  id="batch_date"
                  type="date"
                  value={formData.batch_date}
                  onChange={(e) => setFormData({ ...formData, batch_date: e.target.value })}
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
          </div>

          {/* Purchasing & Reference */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Purchasing & Reference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchase_order">Purchase Order</Label>
                <Input
                  id="purchase_order"
                  value={formData.purchase_order}
                  onChange={(e) => setFormData({ ...formData, purchase_order: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="supplier_invoice_number">Supplier Invoice Number</Label>
                <Input
                  id="supplier_invoice_number"
                  value={formData.supplier_invoice_number}
                  onChange={(e) => setFormData({ ...formData, supplier_invoice_number: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
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

            <div>
              <Label htmlFor="url">Documentation URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
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
              disabled={updateBatchMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {updateBatchMutation.isPending ? 'Updating...' : 'Update Batch'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};