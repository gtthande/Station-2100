import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Edit, Save, X, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface ApprovalBatch {
  id: string;
  batch_number: string;
  quantity: number;
  cost_per_unit: number | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  inventory_products: {
    part_number: string;
    description: string;
  } | null;
  suppliers: {
    name: string;
  } | null;
}

interface EditingBatch {
  id: string;
  quantity: number;
  cost_per_unit: number;
  location: string;
  notes: string;
}

export const BatchApprovalReport = () => {
  const { user } = useAuth();
  const { isAdmin, isSupervisor, isPartsApprover } = useUserRoles();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingBatch, setEditingBatch] = useState<EditingBatch | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const canViewReport = isAdmin() || isSupervisor() || isPartsApprover();
  const canEdit = isAdmin() || isSupervisor() || isPartsApprover();

  const { data: pendingBatches, isLoading } = useQuery({
    queryKey: ['approval-batches-report'],
    queryFn: async () => {
      if (!user || !canViewReport) return [];
      
      const { data, error } = await supabase
        .from('inventory_batches')
        .select(`
          id,
          batch_number,
          quantity,
          cost_per_unit,
          location,
          notes,
          created_at,
          inventory_products!inner (
            part_number,
            description
          ),
          suppliers (
            name
          )
        `)
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && canViewReport,
  });

  const updateBatchMutation = useMutation({
    mutationFn: async (updates: EditingBatch) => {
      const { error } = await supabase
        .from('inventory_batches')
        .update({
          quantity: updates.quantity,
          cost_per_unit: updates.cost_per_unit,
          location: updates.location,
          notes: updates.notes,
        })
        .eq('id', updates.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-batches-report'] });
      setEditingBatch(null);
      toast({
        title: "Batch Updated",
        description: "Changes saved successfully",
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

  const approveBatchMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const { error } = await supabase
        .from('inventory_batches')
        .update({
          approval_status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', batchId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-batches-report'] });
      toast({
        title: "Batch Approved",
        description: "Batch has been approved successfully",
      });
    },
  });

  const handleEditBatch = (batch: ApprovalBatch) => {
    setEditingBatch({
      id: batch.id,
      quantity: batch.quantity,
      cost_per_unit: batch.cost_per_unit || 0,
      location: batch.location || '',
      notes: batch.notes || '',
    });
  };

  const handleSaveEdit = () => {
    if (editingBatch) {
      updateBatchMutation.mutate(editingBatch);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportToExcel = () => {
    if (!pendingBatches || pendingBatches.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(
      pendingBatches.map(batch => ({
        'Batch Number': batch.batch_number,
        'Part Number': batch.inventory_products?.part_number || '',
        'Description': batch.inventory_products?.description || '',
        'Quantity': batch.quantity,
        'Cost Per Unit': batch.cost_per_unit ? `$${batch.cost_per_unit.toFixed(2)}` : 'N/A',
        'Total Value': batch.cost_per_unit ? `$${(batch.cost_per_unit * batch.quantity).toFixed(2)}` : 'N/A',
        'Location': batch.location || '',
        'Supplier': batch.suppliers?.name || '',
        'Submitted Date': format(new Date(batch.created_at), 'MMM dd, yyyy'),
        'Notes': batch.notes || '',
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pending Approvals');
    
    const fileName = `Batch_Approval_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (!canViewReport) {
    return (
      <GlassCard>
        <GlassCardContent className="p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
          <p className="text-white/60">You need appropriate permissions to view this report.</p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  return (
    <>
      <GlassCard className="p-6 hover:bg-white/5 transition-colors cursor-pointer">
        <div onClick={() => setIsReportOpen(true)} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-400" />
              <div>
                <h3 className="text-xl font-semibold text-white">Batch Approval Report</h3>
                <p className="text-white/60">Review and edit batches before approval</p>
              </div>
            </div>
            {pendingBatches && pendingBatches.length > 0 && (
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                {pendingBatches.length} pending
              </Badge>
            )}
          </div>
          <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
            Open Approval Report
          </Button>
        </div>
      </GlassCard>

      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden bg-surface-dark border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Batch Approval Report - Review & Edit
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto">
            {/* Actions */}
            <div className="flex gap-2 print:hidden">
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Print Report
              </Button>
              <Button onClick={handleExportToExcel} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>

            {/* Report Content */}
            <div className="p-4 print:shadow-none print:bg-white print:text-black">
              {/* Print Header */}
              <div className="hidden print:block mb-6 text-center border-b border-gray-300 pb-4">
                <h1 className="text-2xl font-bold">BATCH APPROVAL REPORT</h1>
                <p className="text-sm text-gray-600">Pending Batch Approvals</p>
                <p className="text-sm text-gray-600">Generated on: {format(new Date(), 'MMMM dd, yyyy')}</p>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse text-white/60">Loading approval report...</div>
                </div>
              ) : !pendingBatches || pendingBatches.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/60 print:text-gray-600">No batches pending approval</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingBatches.map((batch) => (
                    <GlassCard key={batch.id} className="print:bg-gray-50 print:shadow-none">
                      <GlassCardContent className="p-6">
                        {editingBatch?.id === batch.id ? (
                          // Edit Mode
                          <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-white print:text-black">
                                Editing: {batch.batch_number}
                              </h3>
                              <div className="flex gap-2 print:hidden">
                                <Button size="sm" onClick={handleSaveEdit}>
                                  <Save className="w-4 h-4 mr-1" />
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingBatch(null)}>
                                  <X className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm text-white/60 print:text-gray-600">Quantity</label>
                                <Input
                                  type="number"
                                  value={editingBatch.quantity}
                                  onChange={(e) => setEditingBatch({
                                    ...editingBatch,
                                    quantity: parseInt(e.target.value) || 0
                                  })}
                                  className="bg-white/5 border-white/10 text-white"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-white/60 print:text-gray-600">Cost Per Unit</label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editingBatch.cost_per_unit}
                                  onChange={(e) => setEditingBatch({
                                    ...editingBatch,
                                    cost_per_unit: parseFloat(e.target.value) || 0
                                  })}
                                  className="bg-white/5 border-white/10 text-white"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-white/60 print:text-gray-600">Location</label>
                                <Input
                                  value={editingBatch.location}
                                  onChange={(e) => setEditingBatch({
                                    ...editingBatch,
                                    location: e.target.value
                                  })}
                                  className="bg-white/5 border-white/10 text-white"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-white/60 print:text-gray-600">Notes</label>
                                <Textarea
                                  value={editingBatch.notes}
                                  onChange={(e) => setEditingBatch({
                                    ...editingBatch,
                                    notes: e.target.value
                                  })}
                                  className="bg-white/5 border-white/10 text-white"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-white print:text-black mb-1">
                                  {batch.batch_number}
                                </h3>
                                <p className="text-white/70 print:text-gray-600">
                                  {batch.inventory_products?.part_number} - {batch.inventory_products?.description}
                                </p>
                              </div>
                              <div className="flex gap-2 print:hidden">
                                {canEdit && (
                                  <Button size="sm" variant="outline" onClick={() => handleEditBatch(batch)}>
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  onClick={() => approveBatchMutation.mutate(batch.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Approve
                                </Button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-white/60 print:text-gray-600">Quantity:</span>
                                <span className="ml-2 text-white print:text-black font-semibold">{batch.quantity}</span>
                              </div>
                              <div>
                                <span className="text-white/60 print:text-gray-600">Cost/Unit:</span>
                                <span className="ml-2 text-white print:text-black">
                                  {batch.cost_per_unit ? `$${batch.cost_per_unit.toFixed(2)}` : 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-white/60 print:text-gray-600">Total Value:</span>
                                <span className="ml-2 text-white print:text-black font-semibold">
                                  {batch.cost_per_unit ? `$${(batch.cost_per_unit * batch.quantity).toFixed(2)}` : 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-white/60 print:text-gray-600">Location:</span>
                                <span className="ml-2 text-white print:text-black">{batch.location || 'N/A'}</span>
                              </div>
                            </div>
                            
                            {batch.suppliers && (
                              <div className="mt-2 text-sm">
                                <span className="text-white/60 print:text-gray-600">Supplier:</span>
                                <span className="ml-2 text-white print:text-black">{batch.suppliers.name}</span>
                              </div>
                            )}
                            
                            {batch.notes && (
                              <div className="mt-2 text-sm">
                                <span className="text-white/60 print:text-gray-600">Notes:</span>
                                <span className="ml-2 text-white print:text-black">{batch.notes}</span>
                              </div>
                            )}
                            
                            <div className="mt-4 text-xs text-white/50 print:text-gray-500">
                              Submitted: {format(new Date(batch.created_at), 'MMM dd, yyyy HH:mm')}
                            </div>
                          </div>
                        )}
                      </GlassCardContent>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>

            {/* Print Styles */}
            <style>{`
              @media print {
                body { -webkit-print-color-adjust: exact; }
                .print\\:hidden { display: none !important; }
                .print\\:block { display: block !important; }
                .print\\:bg-white { background-color: white !important; }
                .print\\:bg-gray-50 { background-color: #f9fafb !important; }
                .print\\:text-black { color: black !important; }
                .print\\:text-gray-600 { color: #6b7280 !important; }
                .print\\:text-gray-500 { color: #6b7280 !important; }
                .print\\:shadow-none { box-shadow: none !important; }
              }
            `}</style>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};