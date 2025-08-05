import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null;
}

export const EditProductDialog = ({ open, onOpenChange, productId }: EditProductDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    part_number: '',
    description: '',
    unit_of_measure: 'each',
    minimum_stock: 0,
    reorder_point: 0,
    unit_cost: 0,
    bin_no: '',
    reorder_qty: 0,
    purchase_price: 0,
    sale_markup: 0,
    sale_price: 0,
    stock_category: '',
    open_balance: 0,
    open_bal_date: '',
    active: true,
    department_id: '',
    superseding_no: '',
    rack: '',
    row_position: ''
  });

  // Fetch product data
  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId || !user) return null;
      
      const { data, error } = await supabase
        .from('inventory_products')
        .select('*')
        .eq('id', productId)
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId && !!user,
  });

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ["departments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("departments")
        .select("id, department_name")
        .eq("user_id", user.id)
        .order("department_name");

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch stock categories
  const { data: stockCategories = [] } = useQuery({
    queryKey: ["stock_categories", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("stock_categories")
        .select("id, category_name")
        .eq("user_id", user.id)
        .order("category_name");

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Update form when product data loads
  useEffect(() => {
    if (product) {
      setFormData({
        part_number: product.part_number || '',
        description: product.description || '',
        unit_of_measure: product.unit_of_measure || 'each',
        minimum_stock: product.minimum_stock || 0,
        reorder_point: product.reorder_point || 0,
        unit_cost: product.unit_cost || 0,
        bin_no: product.bin_no || '',
        reorder_qty: product.reorder_qty || 0,
        purchase_price: product.purchase_price || 0,
        sale_markup: product.sale_markup || 0,
        sale_price: product.sale_price || 0,
        stock_category: product.stock_category || '',
        open_balance: product.open_balance || 0,
        open_bal_date: product.open_bal_date || '',
        active: product.active !== false,
        department_id: product.department_id || '',
        superseding_no: product.superseding_no || '',
        rack: product.rack || '',
        row_position: product.row_position || ''
      });
    }
  }, [product]);

  const updateProductMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user || !productId) throw new Error('User not authenticated or product not selected');
      
      const productData = {
        ...data,
        open_bal_date: data.open_bal_date || null,
      };
      
      const { error } = await supabase
        .from('inventory_products')
        .update(productData)
        .eq('id', productId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
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
    updateProductMutation.mutate(formData);
  };

  if (!open || !productId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-dark border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="part_number">Part Number *</Label>
                <Input
                  id="part_number"
                  value={formData.part_number}
                  onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="department_id">Department</Label>
                <Select value={formData.department_id} onValueChange={(value) => setFormData({ ...formData, department_id: value })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="unit_of_measure">Unit of Measure</Label>
              <Input
                id="unit_of_measure"
                value={formData.unit_of_measure}
                onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* Stock Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Stock Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="minimum_stock">Minimum Stock</Label>
                <Input
                  id="minimum_stock"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minimum_stock}
                  onChange={(e) => setFormData({ ...formData, minimum_stock: parseFloat(e.target.value) || 0 })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="reorder_point">Reorder Point</Label>
                <Input
                  id="reorder_point"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.reorder_point}
                  onChange={(e) => setFormData({ ...formData, reorder_point: parseFloat(e.target.value) || 0 })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="reorder_qty">Reorder Quantity</Label>
                <Input
                  id="reorder_qty"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.reorder_qty}
                  onChange={(e) => setFormData({ ...formData, reorder_qty: parseFloat(e.target.value) || 0 })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="stock_category">Stock Category</Label>
              <Select value={formData.stock_category} onValueChange={(value) => setFormData({ ...formData, stock_category: value })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select stock category" />
                </SelectTrigger>
                <SelectContent>
                  {stockCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Location Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <Label htmlFor="rack">Rack</Label>
                <Input
                  id="rack"
                  value={formData.rack}
                  onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="row_position">Row Position</Label>
                <Input
                  id="row_position"
                  value={formData.row_position}
                  onChange={(e) => setFormData({ ...formData, row_position: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="superseding_no">Superseding Number</Label>
                <Input
                  id="superseding_no"
                  value={formData.superseding_no}
                  onChange={(e) => setFormData({ ...formData, superseding_no: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Pricing Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="unit_cost">Unit Cost</Label>
                <Input
                  id="unit_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="purchase_price">Purchase Price</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="sale_markup">Sale Markup (%)</Label>
                <Input
                  id="sale_markup"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sale_markup}
                  onChange={(e) => setFormData({ ...formData, sale_markup: parseFloat(e.target.value) || 0 })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="sale_price">Sale Price</Label>
                <Input
                  id="sale_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="open_balance">Open Balance</Label>
                <Input
                  id="open_balance"
                  type="number"
                  step="0.01"
                  value={formData.open_balance}
                  onChange={(e) => setFormData({ ...formData, open_balance: parseFloat(e.target.value) || 0 })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label htmlFor="open_bal_date">Open Balance Date</Label>
                <Input
                  id="open_bal_date"
                  type="date"
                  value={formData.open_bal_date}
                  onChange={(e) => setFormData({ ...formData, open_bal_date: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Information</h3>
            
            <div className="flex items-center space-x-2 p-4 bg-white/5 rounded-lg">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active" className="text-white">
                Active Product
              </Label>
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
              disabled={updateProductMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {updateProductMutation.isPending ? 'Updating...' : 'Update Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};