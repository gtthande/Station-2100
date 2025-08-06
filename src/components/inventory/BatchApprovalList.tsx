
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Shield } from 'lucide-react';
import { BatchApprovalCard } from './BatchApprovalCard';

export const BatchApprovalList = () => {
  const { user } = useAuth();
  const { isPartsApprover, isSupervisor, isJobAllocator, isAdmin } = useUserRoles();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const canAccess = isPartsApprover() || isSupervisor() || isJobAllocator() || isAdmin();

  const { data: batches, isLoading } = useQuery({
    queryKey: ['approval-batches', statusFilter],
    queryFn: async () => {
      if (!user || !canAccess) return [];
      
      let query = supabase
        .from('inventory_batches')
        .select(`
          *,
          inventory_products (
            part_number,
            description
          ),
          suppliers (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('approval_status', statusFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && canAccess,
  });

  const filteredBatches = batches?.filter(batch =>
    batch.batch_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.inventory_products?.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.inventory_products?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.job_allocated_to?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.suppliers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.purchase_order?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (!canAccess) {
    return (
      <GlassCard>
        <GlassCardContent className="p-8 text-center">
          <Shield className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
          <p className="text-white/60">You need appropriate permissions to access batch approvals.</p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  if (isLoading) {
    return (
      <GlassCard>
        <GlassCardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading batches...</p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <GlassCard>
        <GlassCardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
              <Input
                placeholder="Search by batch number, part number, description, supplier, or job allocation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface-dark border-white/20">
                <SelectItem value="all" className="text-white">All Status</SelectItem>
                <SelectItem value="pending" className="text-white">Pending</SelectItem>
                <SelectItem value="approved" className="text-white">Approved</SelectItem>
                <SelectItem value="rejected" className="text-white">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Batches Grid */}
      {filteredBatches.length === 0 ? (
        <GlassCard>
          <GlassCardContent className="p-12 text-center">
            <h3 className="text-xl font-semibold text-white mb-2">No Batches Found</h3>
            <p className="text-white/60">
              {searchTerm ? 'No batches match your search criteria.' : 'No batches available for approval.'}
            </p>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBatches.map((batch) => (
            <BatchApprovalCard key={batch.id} batch={batch} />
          ))}
        </div>
      )}
    </div>
  );
};
