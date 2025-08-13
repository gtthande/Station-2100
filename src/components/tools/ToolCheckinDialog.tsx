import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StaffAuthDialog } from '@/components/jobs/StaffAuthDialog';
import { Clock, User } from 'lucide-react';

interface ToolCheckinDialogProps {
  isOpen: boolean;
  toolId: string | null;
  onClose: () => void;
}

export function ToolCheckinDialog({ isOpen, toolId, onClose }: ToolCheckinDialogProps) {
  const [loading, setLoading] = useState(false);
  const [tool, setTool] = useState<any>(null);
  const [currentLoan, setCurrentLoan] = useState<any>(null);
  const [returnNotes, setReturnNotes] = useState('');
  const [showStaffAuth, setShowStaffAuth] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && toolId) {
      fetchToolAndLoan();
    }
  }, [isOpen, toolId]);

  const fetchToolAndLoan = async () => {
    if (!toolId) return;

    // Fetch tool details
    const { data: toolData, error: toolError } = await supabase
      .from('tools')
      .select('*')
      .eq('id', toolId)
      .single();

    if (toolError) {
      toast({
        title: "Error",
        description: "Failed to fetch tool details",
        variant: "destructive"
      });
      return;
    }

    // Fetch current loan
    const { data: loanData, error: loanError } = await supabase
      .from('tool_loans')
      .select(`
        *,
        borrower:profiles!borrower_user_id(full_name, email),
        issuer:profiles!issuer_user_id(full_name, email)
      `)
      .eq('tool_id', toolId)
      .is('returned_at', null)
      .single();

    if (loanError) {
      toast({
        title: "Error",
        description: "No active loan found for this tool",
        variant: "destructive"
      });
      return;
    }

    setTool(toolData);
    setCurrentLoan(loanData);
  };

  const handleCheckin = () => {
    setShowStaffAuth(true);
  };

  const completeCheckin = async (staffMember: any) => {
    if (!currentLoan) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tool_loans')
        .update({
          returned_at: new Date().toISOString(),
          notes: returnNotes.trim() ? 
            (currentLoan.notes ? `${currentLoan.notes}\n\nReturn: ${returnNotes.trim()}` : `Return: ${returnNotes.trim()}`) 
            : currentLoan.notes
        })
        .eq('id', currentLoan.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Tool checked in successfully`
      });

      handleClose();
    } catch (error) {
      console.error('Error checking in tool:', error);
      toast({
        title: "Error",
        description: "Failed to check in tool",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTool(null);
    setCurrentLoan(null);
    setReturnNotes('');
    onClose();
  };

  const isOverdue = currentLoan && new Date(currentLoan.due_at) < new Date();

  if (!tool || !currentLoan) return null;

  return (
    <>
      <Dialog open={isOpen && !showStaffAuth} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Check In Tool: {tool.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Loan Info */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <h4 className="font-medium">Current Loan Details</h4>
              
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Borrower:</strong> {currentLoan.borrower?.full_name || currentLoan.borrower?.email}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Checked out:</strong> {new Date(currentLoan.checkout_at).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`} />
                <span className={`text-sm ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                  <strong>Due:</strong> {new Date(currentLoan.due_at).toLocaleString()}
                  {isOverdue && ' (OVERDUE)'}
                </span>
              </div>

              {currentLoan.notes && (
                <div className="text-sm">
                  <strong>Checkout Notes:</strong> {currentLoan.notes}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="return_notes">Return Notes (Optional)</Label>
              <Textarea
                id="return_notes"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Add any notes about the tool's condition or return"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button 
                onClick={handleCheckin} 
                disabled={loading}
                variant={isOverdue ? 'destructive' : 'default'}
              >
                {loading ? 'Processing...' : (isOverdue ? 'Check In (Overdue)' : 'Check In Tool')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <StaffAuthDialog
        isOpen={showStaffAuth}
        onClose={() => setShowStaffAuth(false)}
        onStaffAuthenticated={completeCheckin}
        action="receive"
      />
    </>
  );
}