import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Package, DollarSign, Building2, Truck, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { useToast } from '@/hooks/use-toast';

interface ProductMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null;
  showApprovalActions?: boolean; // New prop to control approval functionality
}

interface BatchData {
  id: string;
  batch_number: string;
  quantity: number;
  cost_per_unit: number;
  received_date: string;
  expiry_date?: string;
  approval_status: string;
  location?: string;
  supplier_name?: string;
  purchase_order?: string;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
}

export const ProductMovementDialog = ({ open, onOpenChange, productId, showApprovalActions = false }: ProductMovementDialogProps) => {
  const { user } = useAuth();
  const { isAdmin, isSupervisor, isPartsApprover } = useUserRoles();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user can approve batches
  const canApproveBatches = isAdmin() || isSupervisor() || isPartsApprover();

  // Fetch product details
  const { data: product } = useQuery({
    queryKey: ['product-details', productId],
    queryFn: async () => {
      if (!productId || !user) return null;
      
      const { data, error } = await supabase
        .from('inventory_products')
        .select('part_number, description, open_balance, open_bal_date, unit_cost')
        .eq('id', productId)
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId && !!user,
  });

  // Fetch all batches for this product
  const { data: batches, isLoading: batchesLoading, error: batchesError } = useQuery({
    queryKey: ['product-batches', productId],
    queryFn: async () => {
      if (!productId || !user) return [];
      
      console.log('Fetching batches for product:', productId);
      
      const { data, error } = await supabase
        .from('inventory_batches')
        .select(`
          id,
          batch_number,
          quantity,
          cost_per_unit,
          received_date,
          expiry_date,
          approval_status,
          approved_at,
          approved_by,
          location,
          purchase_order,
          created_at,
          suppliers!supplier_id(name)
        `)
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching batches:', error);
        throw error;
      }
      
      console.log('Raw batch data:', data);
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Get approved by names separately
      const batchesWithNames = await Promise.all(
        data.map(async (batch) => {
          let approved_by_name = 'Unknown';
          
          if (batch.approved_by) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', batch.approved_by)
              .maybeSingle();
            
            approved_by_name = profile?.full_name || profile?.email || 'Unknown';
          }
          
          return {
            ...batch,
            supplier_name: (batch.suppliers as any)?.name || 'Unknown',
            approved_by_name
          };
        })
      );
      
      console.log('Processed batches with names:', batchesWithNames);
      return batchesWithNames as (BatchData & { approved_by_name: string })[];
    },
    enabled: !!productId && !!user,
  });

  // Calculate totals
  const approvedStock = batches?.filter(b => b.approval_status === 'approved')
    .reduce((sum, b) => sum + (b.quantity || 0), 0) || 0;
  
  const pendingStock = batches?.filter(b => b.approval_status === 'pending')
    .reduce((sum, b) => sum + (b.quantity || 0), 0) || 0;
  
  const totalStock = (product?.open_balance || 0) + approvedStock;
  
  // Calculate stock value (opening balance + approved batches)
  const openingValue = (product?.open_balance || 0) * (product?.unit_cost || 0);
  const batchesValue = batches?.filter(b => b.approval_status === 'approved')
    .reduce((sum, b) => sum + ((b.quantity || 0) * (b.cost_per_unit || 0)), 0) || 0;
  const totalValue = openingValue + batchesValue;

  
  // Individual batch approval mutation
  const approveBatchMutation = useMutation({
    mutationFn: async ({ batchId, status }: { batchId: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('inventory_batches')
        .update({
          approval_status: status,
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', batchId);
      
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      toast({
        title: status === 'approved' ? "Batch Approved" : "Batch Rejected",
        description: `Batch has been ${status} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['product-batches', productId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-products-with-stock'] });
      queryClient.invalidateQueries({ queryKey: ['approval-batches'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-3 h-3" />;
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'rejected': return <XCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  if (!open || !productId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-dark border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Product Movement - {product?.part_number}
          </DialogTitle>
          {product?.description && (
            <p className="text-white/60 text-sm">{product.description}</p>
          )}
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Summary Section */}
          <GlassCard>
            <GlassCardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Stock Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{totalStock}</div>
                  <div className="text-sm text-white/60">Total Stock</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-300">
                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-white/60">Stock Value</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-300">{approvedStock}</div>
                  <div className="text-sm text-white/60">Approved Stock</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-300">{pendingStock}</div>
                  <div className="text-sm text-white/60">Pending Stock</div>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Opening Balance */}
          {product?.open_balance && product.open_balance > 0 && (
            <GlassCard>
              <GlassCardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Opening Balance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm text-white/60">Quantity:</span>
                    <div className="font-semibold text-white">{product.open_balance}</div>
                  </div>
                  <div>
                    <span className="text-sm text-white/60">Unit Cost:</span>
                    <div className="font-semibold text-white">${product.unit_cost?.toFixed(2) || '0.00'}</div>
                  </div>
                  <div>
                    <span className="text-sm text-white/60">Total Value:</span>
                    <div className="font-semibold text-green-300">${openingValue.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-white/60">Date:</span>
                    <div className="font-semibold text-white">
                      {product.open_bal_date ? new Date(product.open_bal_date).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          )}

          {/* Batch Movements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Truck className="w-5 h-5 text-purple-400" />
              Batch Movements ({batches?.length || 0})
            </h3>
            
            {batchesLoading ? (
              <GlassCard>
                <GlassCardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-white/70">Loading batches...</p>
                </GlassCardContent>
              </GlassCard>
            ) : batchesError ? (
              <GlassCard>
                <GlassCardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-red-400/20 mx-auto mb-3" />
                  <p className="text-red-400">Error loading batches: {batchesError.message}</p>
                </GlassCardContent>
              </GlassCard>
            ) : batches && batches.length > 0 ? (
              <div className="space-y-3">
                {batches.map((batch) => (
                  <GlassCard key={batch.id}>
                    <GlassCardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-white">{batch.batch_number}</h4>
                          <p className="text-sm text-white/60">
                            Created: {new Date(batch.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(batch.approval_status)} flex items-center gap-1`}>
                          {getStatusIcon(batch.approval_status)}
                          {batch.approval_status.charAt(0).toUpperCase() + batch.approval_status.slice(1)}
                        </Badge>
                      </div>
                      
                      {/* Show approval actions for pending batches if user has permission */}
                      {showApprovalActions && canApproveBatches && batch.approval_status === 'pending' && (
                        <div className="flex gap-2 mt-2 mb-3">
                          <Button
                            size="sm"
                            onClick={() => approveBatchMutation.mutate({ batchId: batch.id, status: 'approved' })}
                            disabled={approveBatchMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveBatchMutation.mutate({ batchId: batch.id, status: 'rejected' })}
                            disabled={approveBatchMutation.isPending}
                            className="border-red-500/30 text-red-300 hover:bg-red-500/20"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-white/60">Quantity:</span>
                          <div className="font-semibold text-white">{batch.quantity}</div>
                        </div>
                        <div>
                          <span className="text-white/60">Unit Cost:</span>
                          <div className="font-semibold text-white">${batch.cost_per_unit?.toFixed(2) || '0.00'}</div>
                        </div>
                        <div>
                          <span className="text-white/60">Total Value:</span>
                          <div className="font-semibold text-green-300">
                            ${((batch.quantity || 0) * (batch.cost_per_unit || 0)).toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="text-white/60">Received:</span>
                          <div className="font-semibold text-white">
                            {batch.received_date ? new Date(batch.received_date).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span className="text-white/60">Supplier:</span>
                          <div className="font-semibold text-white truncate">{batch.supplier_name}</div>
                        </div>
                      </div>
                      
                      {/* Show who approved the batch */}
                      {batch.approval_status === 'approved' && batch.approved_at && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="text-sm text-white/60">
                            <span>Approved by: </span>
                            <span className="text-white">{(batch as any).approved_by_name}</span>
                            <span className="ml-2">on {new Date(batch.approved_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                      
                      {(batch.location || batch.purchase_order || batch.expiry_date) && (
                        <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          {batch.location && (
                            <div>
                              <span className="text-white/60">Location:</span>
                              <div className="text-white">{batch.location}</div>
                            </div>
                          )}
                          {batch.purchase_order && (
                            <div>
                              <span className="text-white/60">PO:</span>
                              <div className="text-white">{batch.purchase_order}</div>
                            </div>
                          )}
                          {batch.expiry_date && (
                            <div>
                              <span className="text-white/60">Expiry:</span>
                              <div className="text-white">{new Date(batch.expiry_date).toLocaleDateString()}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </GlassCardContent>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <GlassCard>
                <GlassCardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/60">No batch movements found for this product.</p>
                </GlassCardContent>
              </GlassCard>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};