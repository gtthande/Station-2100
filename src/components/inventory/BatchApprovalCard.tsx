
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Clock, Truck, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface BatchApprovalCardProps {
  batch: any;
}

export const BatchApprovalCard = ({ batch }: BatchApprovalCardProps) => {
  const { user } = useAuth();
  const { isPartsApprover, isJobAllocator, isAdmin } = useUserRoles();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [jobAllocation, setJobAllocation] = useState(batch.job_allocated_to || '');
  const [notes, setNotes] = useState(batch.notes || '');

  const canApprove = isPartsApprover() || isAdmin();
  const canAllocateJob = (isJobAllocator() || isAdmin()) && batch.approval_status === 'approved';

  const approveRejectMutation = useMutation({
    mutationFn: async ({ status }: { status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('inventory_batches')
        .update({
          approval_status: status,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          notes
        })
        .eq('id', batch.id);
      
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      toast({
        title: status === 'approved' ? "Batch Approved" : "Batch Rejected",
        description: `Batch ${batch.batch_number} has been ${status}`,
      });
      queryClient.invalidateQueries({ queryKey: ['inventory-batches'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const allocateJobMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('inventory_batches')
        .update({
          job_allocated_to: jobAllocation,
          job_allocated_by: user?.id,
          job_allocated_at: new Date().toISOString(),
          notes
        })
        .eq('id', batch.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Job Allocated",
        description: `Batch ${batch.batch_number} allocated to ${jobAllocation}`,
      });
      queryClient.invalidateQueries({ queryKey: ['inventory-batches'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = () => {
    const status = batch.approval_status || 'pending';
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      approved: 'bg-green-500/20 text-green-300 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    
    const icons = {
      pending: <Clock className="w-3 h-3" />,
      approved: <CheckCircle className="w-3 h-3" />,
      rejected: <XCircle className="w-3 h-3" />
    };

    return (
      <Badge className={`${colors[status]} border flex items-center gap-1`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <GlassCard className="hover:bg-white/5 transition-all duration-300">
      <GlassCardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <GlassCardTitle className="text-lg mb-1">
              Batch: {batch.batch_number}
            </GlassCardTitle>
            <p className="text-sm text-white/60">
              {batch.inventory_products?.name} ({batch.inventory_products?.part_number})
            </p>
          </div>
          {getStatusBadge()}
        </div>
      </GlassCardHeader>
      
      <GlassCardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-white/60">Quantity:</span>
            <span className="ml-2 text-white font-semibold">{batch.quantity}</span>
          </div>
          <div>
            <span className="text-white/60">Received:</span>
            <span className="ml-2 text-white">
              {batch.received_date ? format(new Date(batch.received_date), 'MMM dd, yyyy') : 'N/A'}
            </span>
          </div>
        </div>

        {batch.job_allocated_to && (
          <div className="flex items-center gap-2 p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <User className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">Allocated to: {batch.job_allocated_to}</span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <Label htmlFor={`notes-${batch.id}`}>Notes</Label>
            <Textarea
              id={`notes-${batch.id}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              rows={2}
              placeholder="Add notes about this batch..."
            />
          </div>

          {canAllocateJob && (
            <div>
              <Label htmlFor={`job-${batch.id}`}>Job Allocation</Label>
              <div className="flex gap-2">
                <Input
                  id={`job-${batch.id}`}
                  value={jobAllocation}
                  onChange={(e) => setJobAllocation(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Job number or description..."
                />
                <Button
                  onClick={() => allocateJobMutation.mutate()}
                  disabled={!jobAllocation.trim() || allocateJobMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Truck className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {canApprove && batch.approval_status === 'pending' && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => approveRejectMutation.mutate({ status: 'approved' })}
              disabled={approveRejectMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button
              onClick={() => approveRejectMutation.mutate({ status: 'rejected' })}
              disabled={approveRejectMutation.isPending}
              variant="outline"
              className="flex-1 border-red-500/30 text-red-300 hover:bg-red-500/20"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
};
