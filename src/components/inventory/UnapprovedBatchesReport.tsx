
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Clock, Package, Shield, Check } from 'lucide-react';
import { format } from 'date-fns';

interface UnapprovedBatch {
  id: string;
  batch_number: string;
  quantity: number;
  created_at: string;
  received_date: string | null;
  user_id: string;
  inventory_products: {
    name: string;
    part_number: string;
  } | null;
  suppliers: {
    name: string;
  } | null;
}

interface ProfileData {
  full_name: string | null;
  email: string;
}

export const UnapprovedBatchesReport = () => {
  const { user } = useAuth();
  const { isAdmin, isSupervisor, isPartsApprover } = useUserRoles();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canViewReport = isAdmin() || isSupervisor() || isPartsApprover();
  const canApprove = isAdmin() || isSupervisor() || isPartsApprover();

  const { data: unapprovedBatches, isLoading } = useQuery({
    queryKey: ['unapproved-batches-report'],
    queryFn: async () => {
      if (!user || !canViewReport) return [];
      
      const { data, error } = await supabase
        .from('inventory_batches')
        .select(`
          id,
          batch_number,
          quantity,
          created_at,
          received_date,
          user_id,
          inventory_products!inner (
            name,
            part_number
          ),
          suppliers (
            name
          )
        `)
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching unapproved batches:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user && canViewReport,
  });

  // Separate query to get profile data for the users
  const { data: profilesData } = useQuery({
    queryKey: ['batch-profiles', unapprovedBatches?.map(b => b.user_id)],
    queryFn: async () => {
      if (!unapprovedBatches || unapprovedBatches.length === 0) return {};
      
      const userIds = [...new Set(unapprovedBatches.map(batch => batch.user_id))];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      if (error) {
        console.error('Error fetching profiles:', error);
        return {};
      }
      
      // Convert to lookup object
      const profilesLookup: Record<string, ProfileData> = {};
      data?.forEach(profile => {
        profilesLookup[profile.id] = {
          full_name: profile.full_name,
          email: profile.email
        };
      });
      
      return profilesLookup;
    },
    enabled: !!unapprovedBatches && unapprovedBatches.length > 0,
  });

  const approveBatchMutation = useMutation({
    mutationFn: async (batchId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('inventory_batches')
        .update({
          approval_status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', batchId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unapproved-batches-report'] });
      queryClient.invalidateQueries({ queryKey: ['approval-batches'] });
      toast({
        title: "Batch Approved",
        description: "The batch has been successfully approved",
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

  const calculateDaysPending = (createdAt: string): number => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleBatchApproval = (batchId: string) => {
    approveBatchMutation.mutate(batchId);
  };

  if (!canViewReport) {
    return (
      <GlassCard>
        <GlassCardContent className="p-8 text-center">
          <Shield className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
          <p className="text-white/60">You need appropriate permissions to view the reminders report.</p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  if (isLoading) {
    return (
      <GlassCard>
        <GlassCardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading reminders report...</p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            Unapproved Batches - Reminders Report
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <p className="text-white/70 mb-4">
            {unapprovedBatches?.length || 0} batches pending approval
          </p>
          {canApprove && (
            <p className="text-white/60 text-sm">
              Click the checkbox or double-click on a batch to approve it
            </p>
          )}
        </GlassCardContent>
      </GlassCard>

      {!unapprovedBatches || unapprovedBatches.length === 0 ? (
        <GlassCard>
          <GlassCardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-green-400/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
            <p className="text-white/60">No batches are pending approval at this time.</p>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {unapprovedBatches.map((batch) => {
            const daysPending = calculateDaysPending(batch.created_at);
            const userProfile = profilesData?.[batch.user_id];
            
            return (
              <GlassCard 
                key={batch.id} 
                className="hover:bg-white/5 transition-all duration-300 cursor-pointer"
                onDoubleClick={() => canApprove && handleBatchApproval(batch.id)}
              >
                <GlassCardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      {canApprove && (
                        <div className="mt-1">
                          <Checkbox
                            id={`approve-${batch.id}`}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleBatchApproval(batch.id);
                              }
                            }}
                            disabled={approveBatchMutation.isPending}
                            className="border-white/30 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                          />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {batch.batch_number}
                        </h3>
                        <p className="text-white/70">
                          {batch.inventory_products?.name} ({batch.inventory_products?.part_number})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={`${
                          daysPending > 7 
                            ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                            : daysPending > 3
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                            : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                        } border flex items-center gap-1`}
                      >
                        <Clock className="w-3 h-3" />
                        {daysPending} days
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-white/60">Quantity:</span>
                      <span className="ml-2 text-white font-semibold">{batch.quantity}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Supplier:</span>
                      <span className="ml-2 text-white">{batch.suppliers?.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Submitted by:</span>
                      <span className="ml-2 text-white">{userProfile?.full_name || userProfile?.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Received:</span>
                      <span className="ml-2 text-white">
                        {batch.received_date ? format(new Date(batch.received_date), 'MMM dd, yyyy') : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-white/50">
                      Submitted: {format(new Date(batch.created_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                    {canApprove && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBatchApproval(batch.id);
                        }}
                        disabled={approveBatchMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    )}
                  </div>
                </GlassCardContent>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
