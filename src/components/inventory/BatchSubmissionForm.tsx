
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { useToast } from '@/hooks/use-toast';
import { Package, Send, ArrowLeft } from 'lucide-react';
import { StaffAuthDialog } from '@/components/jobs/StaffAuthDialog';
import { Link } from 'react-router-dom';

export const BatchSubmissionForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: 0,
    location: '',
    expiry_date: '',
    received_date: new Date().toISOString().split('T')[0],
    supplier_id: '',
    supplier_invoice_number: '',
    purchase_order: '',
    cost_per_unit: 0,
    notes: '',
  });
  
  const [showStaffAuth, setShowStaffAuth] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<any>(null);

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('inventory_products')
        .select('id, part_number, description')
        .order('part_number');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: suppliers, isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const generateBatchNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `BATCH-${timestamp}-${randomSuffix}`;
  };

  const submitBatchMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('User not authenticated');
      
      const batchNumber = generateBatchNumber();
      
      const batchData = {
        ...data,
        user_id: user.id,
        entered_by: user.id, // Automatically set the logged-in user as entered_by
        batch_number: batchNumber,
        approval_status: 'pending',
        status: 'active',
        expiry_date: data.expiry_date || null,
        supplier_id: data.supplier_id || null,
        supplier_invoice_number: data.supplier_invoice_number || null,
        purchase_order: data.purchase_order || null,
        cost_per_unit: data.cost_per_unit || null,
        notes: data.notes || null,
      };
      
      const { error } = await supabase
        .from('inventory_batches')
        .insert(batchData);
      
      if (error) throw error;
      
      return batchNumber;
    },
    onSuccess: (batchNumber) => {
      toast({
        title: "Batch Submitted",
        description: `Batch ${batchNumber} submitted for approval`,
      });
      queryClient.invalidateQueries({ queryKey: ['inventory-batches'] });
      queryClient.invalidateQueries({ queryKey: ['unapproved-batches-report'] });
      
      // Reset form
      setFormData({
        product_id: '',
        quantity: 0,
        location: '',
        expiry_date: '',
        received_date: new Date().toISOString().split('T')[0],
        supplier_id: '',
        supplier_invoice_number: '',
        purchase_order: '',
        cost_per_unit: 0,
        notes: '',
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
    
    if (formData.quantity <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }
    
    setPendingSubmission(formData);
    setShowStaffAuth(true);
  };

  const completeSubmission = async (staffMember: any) => {
    if (!pendingSubmission) return;
    
    const submissionData = {
      ...pendingSubmission,
      entered_by: staffMember.id
    };
    
    submitBatchMutation.mutate(submissionData);
    setShowStaffAuth(false);
    setPendingSubmission(null);
  };

  if (loadingProducts || loadingSuppliers) {
    return (
      <GlassCard>
        <GlassCardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading form data...</p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Submit New Batch for Approval
        </GlassCardTitle>
      </GlassCardHeader>
      
      <GlassCardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product_id">Product *</Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent className="bg-surface-dark border-white/20">
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id} className="text-white">
                      {product.part_number} - {product.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="location">Warehouse Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Rack-Bin (e.g., A1-B3)"
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
                placeholder="Invoice number from supplier"
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
              placeholder="Additional notes about this batch..."
            />
          </div>

          <div className="flex justify-between pt-4">
            <Link to="/">
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={submitBatchMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitBatchMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          </div>
        </form>
      </GlassCardContent>
      
      <StaffAuthDialog
        isOpen={showStaffAuth}
        onClose={() => setShowStaffAuth(false)}
        onStaffAuthenticated={completeSubmission}
        action="receive"
      />
    </GlassCard>
  );
};
