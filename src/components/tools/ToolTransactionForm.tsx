import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { useToast } from '@/hooks/use-toast';
import { LogOut, LogIn, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Tool {
  id: string;
  name: string;
  sku?: string;
  serial_no?: string;
  status: 'in_stock' | 'checked_out' | 'maintenance' | 'lost';
  default_due_hours?: number;
  current_loan?: {
    id: string;
    borrower_user_id: string;
    borrower_name?: string;
    checkout_at: string;
    due_at: string;
    notes?: string;
  };
}

export const ToolTransactionForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [checkoutData, setCheckoutData] = useState({
    tool_id: '',
    borrower_user_id: '',
    borrower_email: '',
    notes: '',
    auth_method: 'code' as const
  });

  const [checkinData, setCheckinData] = useState({
    tool_id: '',
    notes: ''
  });

  // Fetch available tools for checkout
  const { data: availableTools } = useQuery({
    queryKey: ['available-tools'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'in_stock')
        .order('name');

      if (error) throw error;
      return data as Tool[];
    },
    enabled: !!user,
  });

  // Fetch checked out tools for checkin
  const { data: checkedOutTools } = useQuery({
    queryKey: ['checked-out-tools'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('tools')
        .select(`
          *,
          tool_loans!inner (
            id,
            borrower_user_id,
            checkout_at,
            due_at,
            notes,
            profiles!borrower_user_id (
              full_name,
              email
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'checked_out')
        .is('tool_loans.returned_at', null)
        .order('name');

      if (error) throw error;

      // Process tools to include current loan info
      const processedTools = data?.map(tool => {
        const currentLoan = tool.tool_loans?.[0];
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

  // Fetch staff for borrower selection
  const { data: staff } = useQuery({
    queryKey: ['staff-profiles'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('is_staff', true)
        .order('full_name');

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (data: typeof checkoutData) => {
      if (!user) throw new Error('User not authenticated');
      
      // Get tool details for due date calculation
      const { data: tool, error: toolError } = await supabase
        .from('tools')
        .select('default_due_hours')
        .eq('id', data.tool_id)
        .single();

      if (toolError) throw toolError;

      // Calculate due date
      const checkoutAt = new Date();
      const dueAt = new Date(checkoutAt.getTime() + (tool.default_due_hours || 24) * 60 * 60 * 1000);

      const loanData = {
        user_id: user.id,
        tool_id: data.tool_id,
        borrower_user_id: data.borrower_user_id,
        issuer_user_id: user.id,
        checkout_at: checkoutAt.toISOString(),
        due_at: dueAt.toISOString(),
        notes: data.notes.trim() || null,
        auth_method: data.auth_method
      };
      
      const { error } = await supabase
        .from('tool_loans')
        .insert(loanData);
      
      if (error) throw error;
      
      return loanData;
    },
    onSuccess: () => {
      toast({
        title: "Tool Checked Out",
        description: "Tool has been successfully checked out",
      });
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      queryClient.invalidateQueries({ queryKey: ['available-tools'] });
      queryClient.invalidateQueries({ queryKey: ['checked-out-tools'] });
      queryClient.invalidateQueries({ queryKey: ['tool-events'] });
      
      setCheckoutData({
        tool_id: '',
        borrower_user_id: '',
        borrower_email: '',
        notes: '',
        auth_method: 'code'
      });
    },
    onError: (error) => {
      toast({
        title: "Checkout Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const checkinMutation = useMutation({
    mutationFn: async (data: typeof checkinData) => {
      if (!user) throw new Error('User not authenticated');
      
      // Find the active loan for this tool
      const { data: loans, error: loanError } = await supabase
        .from('tool_loans')
        .select('id')
        .eq('tool_id', data.tool_id)
        .is('returned_at', null)
        .limit(1);

      if (loanError) throw loanError;
      if (!loans || loans.length === 0) throw new Error('No active loan found for this tool');

      const { error } = await supabase
        .from('tool_loans')
        .update({
          returned_at: new Date().toISOString(),
          notes: data.notes.trim() || null
        })
        .eq('id', loans[0].id);
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Tool Checked In",
        description: "Tool has been successfully returned",
      });
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      queryClient.invalidateQueries({ queryKey: ['available-tools'] });
      queryClient.invalidateQueries({ queryKey: ['checked-out-tools'] });
      queryClient.invalidateQueries({ queryKey: ['tool-events'] });
      
      setCheckinData({
        tool_id: '',
        notes: ''
      });
    },
    onError: (error) => {
      toast({
        title: "Checkin Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkoutData.tool_id) {
      toast({
        title: "Error",
        description: "Please select a tool to checkout",
        variant: "destructive",
      });
      return;
    }
    
    if (!checkoutData.borrower_user_id) {
      toast({
        title: "Error",
        description: "Please select who is borrowing the tool",
        variant: "destructive",
      });
      return;
    }
    
    checkoutMutation.mutate(checkoutData);
  };

  const handleCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkinData.tool_id) {
      toast({
        title: "Error",
        description: "Please select a tool to check in",
        variant: "destructive",
      });
      return;
    }
    
    checkinMutation.mutate(checkinData);
  };

  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Tool Checkout & Check-in Transactions
        </GlassCardTitle>
      </GlassCardHeader>
      
      <GlassCardContent>
        <Tabs defaultValue="checkout" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="checkout" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Check Out Tool
            </TabsTrigger>
            <TabsTrigger value="checkin" className="flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              Check In Tool
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checkout" className="space-y-4">
            <form onSubmit={handleCheckout} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="checkout_tool">Tool to Check Out *</Label>
                  <Select
                    value={checkoutData.tool_id}
                    onValueChange={(value) => setCheckoutData({ ...checkoutData, tool_id: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select available tool" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-dark border-white/20">
                      {availableTools?.map((tool) => (
                        <SelectItem key={tool.id} value={tool.id} className="text-white">
                          {tool.name} {tool.sku && `(${tool.sku})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="borrower">Borrower (Staff Member) *</Label>
                  <Select
                    value={checkoutData.borrower_user_id}
                    onValueChange={(value) => setCheckoutData({ ...checkoutData, borrower_user_id: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-dark border-white/20">
                      {staff?.map((member) => (
                        <SelectItem key={member.id} value={member.id} className="text-white">
                          {member.full_name || member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="checkout_notes">Notes</Label>
                <Textarea
                  id="checkout_notes"
                  value={checkoutData.notes}
                  onChange={(e) => setCheckoutData({ ...checkoutData, notes: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  rows={3}
                  placeholder="Purpose of borrowing, expected usage, etc."
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={checkoutMutation.isPending}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {checkoutMutation.isPending ? 'Checking Out...' : 'Check Out Tool'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="checkin" className="space-y-4">
            <form onSubmit={handleCheckin} className="space-y-4">
              <div>
                <Label htmlFor="checkin_tool">Tool to Check In *</Label>
                <Select
                  value={checkinData.tool_id}
                  onValueChange={(value) => setCheckinData({ ...checkinData, tool_id: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select tool to return" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-dark border-white/20">
                    {checkedOutTools?.map((tool) => (
                      <SelectItem key={tool.id} value={tool.id} className="text-white">
                        {tool.name} {tool.sku && `(${tool.sku})`} - Borrowed by: {tool.current_loan?.borrower_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="checkin_notes">Return Notes</Label>
                <Textarea
                  id="checkin_notes"
                  value={checkinData.notes}
                  onChange={(e) => setCheckinData({ ...checkinData, notes: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  rows={3}
                  placeholder="Condition on return, any issues noted, etc."
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={checkinMutation.isPending}
                  className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  {checkinMutation.isPending ? 'Checking In...' : 'Check In Tool'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </GlassCardContent>
    </GlassCard>
  );
};