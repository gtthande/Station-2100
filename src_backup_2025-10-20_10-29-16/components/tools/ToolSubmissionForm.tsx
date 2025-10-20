import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { useToast } from '@/hooks/use-toast';
import { Wrench, ArrowLeft } from 'lucide-react';
import { StaffAuthDialog } from '@/components/jobs/StaffAuthDialog';
import { Link } from 'react-router-dom';

export const ToolSubmissionForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    serial_no: '',
    calibration_date: '',
    default_due_hours: 24,
  });
  
  const [showStaffAuth, setShowStaffAuth] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<any>(null);

  const createToolMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('User not authenticated');

      const toolData = {
        user_id: user.id,
        name: data.name.trim(),
        sku: data.sku.trim() || null,
        serial_no: data.serial_no.trim() || null,
        calibration_date: data.calibration_date || null,
        default_due_hours: data.default_due_hours || 24,
        status: 'in_stock' as const
      };

      const { error } = await supabase
        .from('tools')
        .insert(toolData);

      if (error) throw error;
      return toolData;
    },
    onSuccess: () => {
      toast({
        title: "Tool Added",
        description: "Tool has been successfully added to inventory",
      });
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      queryClient.invalidateQueries({ queryKey: ['available-tools'] });
      
      setFormData({
        name: '',
        sku: '',
        serial_no: '',
        calibration_date: '',
        default_due_hours: 24,
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
        description: "Tool name is required",
        variant: "destructive",
      });
      return;
    }
    
    setPendingSubmission(formData);
    setShowStaffAuth(true);
  };

  const completeSubmission = async (staffMember: any) => {
    if (!pendingSubmission) return;
    
    createToolMutation.mutate(pendingSubmission);
    setShowStaffAuth(false);
    setPendingSubmission(null);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Add New Tool
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
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Enter tool name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Enter SKU (optional)"
                />
              </div>

              <div>
                <Label htmlFor="serial_no">Serial Number</Label>
                <Input
                  id="serial_no"
                  value={formData.serial_no}
                  onChange={(e) => handleInputChange('serial_no', e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Enter serial number (optional)"
                />
              </div>

              <div>
                <Label htmlFor="calibration_date">Calibration Date</Label>
                <Input
                  id="calibration_date"
                  type="date"
                  value={formData.calibration_date}
                  onChange={(e) => handleInputChange('calibration_date', e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="default_due_hours">Default Due Hours</Label>
                <Input
                  id="default_due_hours"
                  type="number"
                  min="1"
                  value={formData.default_due_hours}
                  onChange={(e) => handleInputChange('default_due_hours', parseInt(e.target.value) || 24)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="24"
                />
              </div>
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
                disabled={createToolMutation.isPending}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex items-center gap-2"
              >
                <Wrench className="w-4 h-4" />
                {createToolMutation.isPending ? 'Adding Tool...' : 'Add Tool'}
              </Button>
            </div>
          </form>
        </GlassCardContent>
      </GlassCard>
      
      <StaffAuthDialog
        isOpen={showStaffAuth}
        onClose={() => setShowStaffAuth(false)}
        onStaffAuthenticated={completeSubmission}
        action="receive"
      />
    </>
  );
};