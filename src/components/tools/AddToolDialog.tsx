import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AddToolDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddToolDialog({ isOpen, onClose, onSuccess }: AddToolDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    serial_no: '',
    default_due_hours: 24
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Tool name is required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tools')
        .insert({
          user_id: user.id,
          name: formData.name.trim(),
          sku: formData.sku.trim() || null,
          serial_no: formData.serial_no.trim() || null,
          default_due_hours: formData.default_due_hours,
          status: 'in_stock'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tool added successfully"
      });

      // Reset form
      setFormData({
        name: '',
        sku: '',
        serial_no: '',
        default_due_hours: 24
      });

      onSuccess();
    } catch (error) {
      console.error('Error adding tool:', error);
      toast({
        title: "Error",
        description: "Failed to add tool",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      sku: '',
      serial_no: '',
      default_due_hours: 24
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Tool</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tool Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter tool name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
              placeholder="Enter SKU (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serial_no">Serial Number</Label>
            <Input
              id="serial_no"
              value={formData.serial_no}
              onChange={(e) => setFormData(prev => ({ ...prev, serial_no: e.target.value }))}
              placeholder="Enter serial number (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_due_hours">Default Due Hours</Label>
            <Input
              id="default_due_hours"
              type="number"
              min="1"
              value={formData.default_due_hours}
              onChange={(e) => setFormData(prev => ({ ...prev, default_due_hours: parseInt(e.target.value) || 24 }))}
              placeholder="24"
            />
            <p className="text-sm text-muted-foreground">
              How many hours after checkout should this tool be due back?
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Tool'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}