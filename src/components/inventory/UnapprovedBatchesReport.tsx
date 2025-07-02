
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Package, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface UnapprovedBatch {
  id: string;
  batch_number: string;
  quantity: number;
  created_at: string;
  received_date: string | null;
  inventory_products: {
    name: string;
    part_number: string;
  } | null;
  suppliers: {
    name: string;
  } | null;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

export const UnapprovedBatchesReport = () => {
  const { user } = useAuth();
  const { isAdmin, isSupervisor, isPartsApprover } = useUserRoles();

  const canViewReport = isAdmin() || isSupervisor() || isPartsApprover();

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
          inventory_products!inner (
            name,
            part_number
          ),
          suppliers (
            name
          ),
          profiles!inner (
            full_name,
            email
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

  const calculateDaysPending = (createdAt: string): number => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
            
            return (
              <GlassCard key={batch.id} className="hover:bg-white/5 transition-all duration-300">
                <GlassCardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {batch.batch_number}
                      </h3>
                      <p className="text-white/70">
                        {batch.inventory_products?.name} ({batch.inventory_products?.part_number})
                      </p>
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
                      <span className="ml-2 text-white">{batch.profiles?.full_name || batch.profiles?.email}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Received:</span>
                      <span className="ml-2 text-white">
                        {batch.received_date ? format(new Date(batch.received_date), 'MMM dd, yyyy') : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-white/50">
                    Submitted: {format(new Date(batch.created_at), 'MMM dd, yyyy HH:mm')}
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
