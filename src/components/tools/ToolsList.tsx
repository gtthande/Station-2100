import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Wrench, Plus, LogOut, LogIn, Clock, CheckCircle2 } from 'lucide-react';
import { AddToolDialog } from './AddToolDialog';
import { ToolCheckoutDialog } from './ToolCheckoutDialog';
import { ToolCheckinDialog } from './ToolCheckinDialog';

interface Tool {
  id: string;
  name: string;
  sku?: string;
  serial_no?: string;
  status: 'in_stock' | 'checked_out' | 'maintenance' | 'lost';
  default_due_hours?: number;
  created_at: string;
  updated_at: string;
  current_loan?: {
    id: string;
    borrower_user_id: string;
    borrower_name?: string;
    checkout_at: string;
    due_at: string;
    notes?: string;
  };
}

export const ToolsList = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [checkoutDialog, setCheckoutDialog] = useState<{ isOpen: boolean; toolId: string | null }>({
    isOpen: false,
    toolId: null
  });
  const [checkinDialog, setCheckinDialog] = useState<{ isOpen: boolean; toolId: string | null }>({
    isOpen: false,
    toolId: null
  });

  const { data: tools, isLoading, refetch } = useQuery({
    queryKey: ['tools'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: toolsData, error } = await supabase
        .from('tools')
        .select(`
          *,
          tool_loans!inner (
            id,
            borrower_user_id,
            checkout_at,
            due_at,
            returned_at,
            notes,
            profiles!borrower_user_id (
              full_name,
              email
            )
          )
        `)
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      // Process tools to include current loan info
      const processedTools = toolsData?.map(tool => {
        const currentLoan = tool.tool_loans?.find(loan => !loan.returned_at);
        return {
          ...tool,
          current_loan: currentLoan ? {
            id: currentLoan.id,
            borrower_user_id: currentLoan.borrower_user_id,
            borrower_name: currentLoan.profiles?.full_name || currentLoan.profiles?.email,
            checkout_at: currentLoan.checkout_at,
            due_at: currentLoan.due_at,
            notes: currentLoan.notes
          } : undefined
        };
      }) || [];

      return processedTools as Tool[];
    },
    enabled: !!user,
  });

  const filteredTools = tools?.filter(tool =>
    tool.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.serial_no?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleCheckout = (toolId: string) => {
    setCheckoutDialog({ isOpen: true, toolId });
  };

  const handleCheckin = (toolId: string) => {
    setCheckinDialog({ isOpen: true, toolId });
  };

  const handleDialogClose = () => {
    setCheckoutDialog({ isOpen: false, toolId: null });
    setCheckinDialog({ isOpen: false, toolId: null });
    refetch();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Available</Badge>;
      case 'checked_out':
        return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Checked Out</Badge>;
      case 'maintenance':
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Maintenance</Badge>;
      case 'lost':
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Lost</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isOverdue = (dueAt: string) => {
    return new Date(dueAt) < new Date();
  };

  if (isLoading) {
    return (
      <GlassCard>
        <GlassCardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading tools...</p>
        </GlassCardContent>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Tool */}
      <GlassCard>
        <GlassCardContent className="p-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
              <Input
                placeholder="Search tools by name, SKU, or serial number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white"
              />
            </div>
            <GradientButton onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Tool
            </GradientButton>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Tools Grid */}
      {filteredTools.length === 0 ? (
        <GlassCard>
          <GlassCardContent className="p-12 text-center">
            <Wrench className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Tools Found</h3>
            <p className="text-white/60 mb-6">
              {searchTerm ? 'No tools match your search criteria.' : 'Start by adding your first tool to the inventory.'}
            </p>
            <GradientButton onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Tool
            </GradientButton>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <GlassCard key={tool.id} className="hover:bg-white/5 transition-all duration-300">
              <GlassCardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <GlassCardTitle className="text-lg mb-1">{tool.name}</GlassCardTitle>
                    <div className="space-y-1">
                      {tool.sku && (
                        <p className="text-sm text-white/60">SKU: {tool.sku}</p>
                      )}
                      {tool.serial_no && (
                        <p className="text-sm text-white/60">Serial: {tool.serial_no}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {getStatusBadge(tool.status)}
                    {tool.status === 'in_stock' ? (
                      <GradientButton
                        size="sm"
                        onClick={() => handleCheckout(tool.id)}
                        className="flex items-center gap-1"
                      >
                        <LogOut className="w-3 h-3" />
                        Check Out
                      </GradientButton>
                    ) : tool.status === 'checked_out' ? (
                      <GradientButton
                        size="sm"
                        variant="outline"
                        onClick={() => handleCheckin(tool.id)}
                        className="flex items-center gap-1"
                      >
                        <LogIn className="w-3 h-3" />
                        Check In
                      </GradientButton>
                    ) : null}
                  </div>
                </div>
              </GlassCardHeader>
              <GlassCardContent className="pt-0">
                <div className="space-y-3">
                  {tool.current_loan && (
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium text-yellow-300">Current Loan</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/60">Borrower:</span>
                          <span className="text-white">{tool.current_loan.borrower_name || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Due:</span>
                          <span className={`text-white ${isOverdue(tool.current_loan.due_at) ? 'text-red-400' : ''}`}>
                            {new Date(tool.current_loan.due_at).toLocaleDateString()}
                          </span>
                        </div>
                        {isOverdue(tool.current_loan.due_at) && (
                          <div className="flex items-center gap-1 text-red-400 text-xs">
                            <Clock className="w-3 h-3" />
                            Overdue
                          </div>
                        )}
                        {tool.current_loan.notes && (
                          <div className="text-xs text-white/60 mt-2">
                            Note: {tool.current_loan.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60">Default Due:</span>
                    <span className="text-white">{tool.default_due_hours || 24} hours</span>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddToolDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={() => {
          setShowAddDialog(false);
          refetch();
        }}
      />

      <ToolCheckoutDialog
        isOpen={checkoutDialog.isOpen}
        toolId={checkoutDialog.toolId}
        onClose={handleDialogClose}
      />

      <ToolCheckinDialog
        isOpen={checkinDialog.isOpen}
        toolId={checkinDialog.toolId}
        onClose={handleDialogClose}
      />
    </div>
  );
};