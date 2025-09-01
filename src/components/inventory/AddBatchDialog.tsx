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
    supplier_id: '',
    supplier_invoice_number: '',
    quantity: 0,
    cost_per_unit: 0,
    received_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    location: '',
    purchase_order: '',
    notes: '',
    url: '',
    // New fields from previous system
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

  // Generate a readable unique-ish batch number when dialog opens
  const generateBatchNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `BATCH-${timestamp}-${randomSuffix}`;
  };

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

  // Fetch products to ensure every batch is attached to a parent product
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

  useEffect(() => {
    if (selectedProductId) {
      setFormData(prev => ({ ...prev, product_id: selectedProductId }));
    }
  }, [selectedProductId]);

  // When dialog opens, prefill a batch number if missing
  useEffect(() => {
    if (open) {
      setFormData(prev => ({
        ...prev,
        batch_number: prev.batch_number || generateBatchNumber(),
        product_id: selectedProductId || prev.product_id
      }));
    }
  }, [open]);

  const createBatchMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('User not authenticated');
      
      const batchData = {
        ...data,
        user_id: user.id,
        entered_by: user.id,
        supplier_id: data.supplier_id || null,
        supplier_invoice_number: data.supplier_invoice_number || null,
        expiry_date: data.expiry_date || null,
        batch_date: data.batch_date || null,
      };

      const { error } = await supabase
        .from('inventory_batches')
        .insert(batchData);
      
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
        batch_number: generateBatchNumber(),
        product_id: selectedProductId || '',
        supplier_id: '',
        supplier_invoice_number: '',
        quantity: 0,
        cost_per_unit: 0,
        received_date: new Date().toISOString().split('T')[0],
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
    createBatchMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-dark border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Batch</DialogTitle>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sale_markup_percent">Sale Markup %</Label>
                <Input
                  id="sale_markup_percent"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sale_markup_percent}
                  onChange={(e) => setFormData({ ...formData, sale_markup_percent: parseFloat(e.target.value) || 0 })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="sale_markup_value">Sale Markup Value</Label>
                <Input
                  id="sale_markup_value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sale_markup_value}
                  onChange={(e) => setFormData({ ...formData, sale_markup_value: parseFloat(e.target.value) || 0 })}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="lpo">LPO</Label>
                <Input
                  id="lpo"
                  value={formData.lpo}
                  onChange={(e) => setFormData({ ...formData, lpo: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
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

              <div>
                <Label htmlFor="reference_no">Reference Number</Label>
                <Input
                  id="reference_no"
                  value={formData.reference_no}
                  onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier_invoice_number">Supplier Invoice Number</Label>
                <Input
                  id="supplier_invoice_number"
                  value={formData.supplier_invoice_number}
                  onChange={(e) => setFormData({ ...formData, supplier_invoice_number: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="aircraft_reg_no">Aircraft Registration</Label>
                <Input
                  id="aircraft_reg_no"
                  value={formData.aircraft_reg_no}
                  onChange={(e) => setFormData({ ...formData, aircraft_reg_no: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </div>

          {/* Identifiers & Codes */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Identifiers & Codes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="batch_id_a">Batch ID A</Label>
                <Input
                  id="batch_id_a"
                  value={formData.batch_id_a}
                  onChange={(e) => setFormData({ ...formData, batch_id_a: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="batch_id_b">Batch ID B</Label>
                <Input
                  id="batch_id_b"
                  value={formData.batch_id_b}
                  onChange={(e) => setFormData({ ...formData, batch_id_b: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="serial_no">Serial Number</Label>
                <Input
                  id="serial_no"
                  value={formData.serial_no}
                  onChange={(e) => setFormData({ ...formData, serial_no: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="core_id">Core ID</Label>
                <Input
                  id="core_id"
                  value={formData.core_id}
                  onChange={(e) => setFormData({ ...formData, core_id: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="core_value">Core Value</Label>
                <Input
                  id="core_value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.core_value}
                  onChange={(e) => setFormData({ ...formData, core_value: parseFloat(e.target.value) || 0 })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </div>

          {/* Personnel & Verification */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personnel & Verification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="received_by">Received By</Label>
                <Input
                  id="received_by"
                  value={formData.received_by}
                  onChange={(e) => setFormData({ ...formData, received_by: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="receive_code">Receive Code</Label>
                <Input
                  id="receive_code"
                  value={formData.receive_code}
                  onChange={(e) => setFormData({ ...formData, receive_code: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="verified_by">Verified By</Label>
                <Input
                  id="verified_by"
                  value={formData.verified_by}
                  onChange={(e) => setFormData({ ...formData, verified_by: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="verification_code">Verification Code</Label>
                <Input
                  id="verification_code"
                  value={formData.verification_code}
                  onChange={(e) => setFormData({ ...formData, verification_code: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </div>

          {/* Additional Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Information</h3>
            
            <div>
              <Label htmlFor="alternate_department_id">Alternate Department ID</Label>
              <Input
                id="alternate_department_id"
                value={formData.alternate_department_id}
                onChange={(e) => setFormData({ ...formData, alternate_department_id: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
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