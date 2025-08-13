import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { useToast } from '@/hooks/use-toast';
import { Wrench, Send } from 'lucide-react';

export const ToolSubmissionForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    serial_no: '',
    default_due_hours: 24,
    notes: ''
  });

  const generateToolSKU = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
    return `TOOL-${timestamp}-${randomSuffix}`;
  };

  const submitToolMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('User not authenticated');
      
      const toolData = {
        user_id: user.id,
        name: data.name.trim(),
        sku: data.sku.trim() || generateToolSKU(),
        serial_no: data.serial_no.trim() || null,
        default_due_hours: data.default_due_hours,
        status: 'in_stock' as const
      };
      
      const { error } = await supabase
        .from('tools')
        .insert(toolData);
      
      if (error) throw error;
      
      return toolData;
    },
    onSuccess: (toolData) => {
      toast({
        title: "Tool Added",
        description: `Tool "${toolData.name}" has been added to inventory`,
      });
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      queryClient.invalidateQueries({ queryKey: ['tool-events'] });
      
      // Reset form
      setFormData({
        name: '',
        sku: '',
        serial_no: '',
        default_due_hours: 24,
        notes: ''
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
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tool name",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.default_due_hours <= 0) {
      toast({
        title: "Error",
        description: "Default due hours must be greater than 0",
        variant: "destructive",
      });
      return;
    }
    
    submitToolMutation.mutate(formData);
  };

  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle className="flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Add New Tool to Inventory
        </GlassCardTitle>
      </GlassCardHeader>
      
      <GlassCardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Tool Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Enter tool name (e.g., Torque Wrench)"
                required
              />
            </div>

            <div>
              <Label htmlFor="sku">SKU/Tool Code</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Auto-generated if left blank"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serial_no">Serial Number</Label>
              <Input
                id="serial_no"
                value={formData.serial_no}
                onChange={(e) => setFormData({ ...formData, serial_no: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Tool serial number (if applicable)"
              />
            </div>
            
            <div>
              <Label htmlFor="default_due_hours">Default Loan Period (Hours) *</Label>
              <Input
                id="default_due_hours"
                type="number"
                min="1"
                max="8760"
                value={formData.default_due_hours}
                onChange={(e) => setFormData({ ...formData, default_due_hours: parseInt(e.target.value) || 24 })}
                className="bg-white/5 border-white/10 text-white"
                required
              />
              <p className="text-xs text-white/60 mt-1">
                How many hours after checkout should this tool be due back?
              </p>
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
              placeholder="Additional notes about this tool (specifications, usage, etc.)"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={submitToolMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitToolMutation.isPending ? 'Adding Tool...' : 'Add Tool to Inventory'}
            </Button>
          </div>
        </form>
      </GlassCardContent>
    </GlassCard>
  );
};