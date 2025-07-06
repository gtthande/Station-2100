import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddProductDialog = ({ open, onOpenChange }: AddProductDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    part_number: '',
    name: '',
    description: '',
    category: '',
    manufacturer: '',
    unit_of_measure: 'each',
    minimum_stock: 0,
    reorder_point: 0,
    unit_cost: 0,
    is_owner_supplied: false,
    markup_percentage: 25.00,
    sale_price: 0,
    owner_cost_price: 0
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('inventory_products')
        .insert({
          ...data,
          user_id: user.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      onOpenChange(false);
      setFormData({
        part_number: '',
        name: '',
        description: '',
        category: '',
        manufacturer: '',
        unit_of_measure: 'each',
        minimum_stock: 0,
        reorder_point: 0,
        unit_cost: 0,
        is_owner_supplied: false,
        markup_percentage: 25.00,
        sale_price: 0,
        owner_cost_price: 0
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
    createProductMutation.mutate(formData);
  };

  // Calculate automatic sale price based on markup
  const calculateSalePrice = () => {
    if (formData.is_owner_supplied) {
      return formData.owner_cost_price;
    } else {
      return formData.unit_cost * (1 + formData.markup_percentage / 100);
    }
  };

  // Update sale price when relevant fields change
  const handleCostOrMarkupChange = (field: string, value: number) => {
    const newFormData = { ...formData, [field]: value };
    if (!formData.is_owner_supplied && (field === 'unit_cost' || field === 'markup_percentage')) {
      newFormData.sale_price = newFormData.unit_cost * (1 + newFormData.markup_percentage / 100);
    } else if (formData.is_owner_supplied && field === 'owner_cost_price') {
      newFormData.sale_price = value;
    }
    setFormData(newFormData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-dark border-white/20 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                required
              />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="e.g., Engine Parts, Avionics"
              />
            </div>
            
            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="unit_of_measure">Unit of Measure</Label>
              <Input
                id="unit_of_measure"
                value={formData.unit_of_measure}
                onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="minimum_stock">Minimum Stock</Label>
              <Input
                id="minimum_stock"
                type="number"
                min="0"
                value={formData.minimum_stock}
                onChange={(e) => setFormData({ ...formData, minimum_stock: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="reorder_point">Reorder Point</Label>
              <Input
                id="reorder_point"
                type="number"
                min="0"
                value={formData.reorder_point}
                onChange={(e) => setFormData({ ...formData, reorder_point: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* Owner Supplied Toggle */}
          <div className="flex items-center space-x-2 p-4 bg-white/5 rounded-lg">
            <Switch
              id="is_owner_supplied"
              checked={formData.is_owner_supplied}
              onCheckedChange={(checked) => setFormData({ ...formData, is_owner_supplied: checked })}
            />
            <Label htmlFor="is_owner_supplied" className="text-white">
              Owner Supplied Item
            </Label>
            <p className="text-sm text-white/60 ml-2">
              (Owner supplied items are issued at cost price)
            </p>
          </div>

          {/* Pricing Section */}
          <div className="space-y-4 p-4 bg-white/5 rounded-lg">
            <h3 className="text-lg font-medium text-white">Pricing</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit_cost">Unit Cost ($) *</Label>
                <Input
                  id="unit_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unit_cost}
                  onChange={(e) => handleCostOrMarkupChange('unit_cost', parseFloat(e.target.value) || 0)}
                  className="bg-white/5 border-white/10 text-white"
                  required
                />
              </div>

              {formData.is_owner_supplied ? (
                <div>
                  <Label htmlFor="owner_cost_price">Owner Cost Price ($)</Label>
                  <Input
                    id="owner_cost_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.owner_cost_price}
                    onChange={(e) => handleCostOrMarkupChange('owner_cost_price', parseFloat(e.target.value) || 0)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="markup_percentage">Markup Percentage (%)</Label>
                  <Input
                    id="markup_percentage"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.markup_percentage}
                    onChange={(e) => handleCostOrMarkupChange('markup_percentage', parseFloat(e.target.value) || 0)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="sale_price">Sale Price ($)</Label>
              <Input
                id="sale_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
                className="bg-white/5 border-white/10 text-white"
                placeholder={`Auto-calculated: $${calculateSalePrice().toFixed(2)}`}
              />
              <p className="text-sm text-white/60 mt-1">
                Leave blank to use auto-calculated price: ${calculateSalePrice().toFixed(2)}
              </p>
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
              disabled={createProductMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {createProductMutation.isPending ? 'Creating...' : 'Create Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
