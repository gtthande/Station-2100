import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StaffAuthDialog } from '@/components/jobs/StaffAuthDialog';

interface ToolCheckoutDialogProps {
  isOpen: boolean;
  toolId: string | null;
  onClose: () => void;
}

export function ToolCheckoutDialog({ isOpen, toolId, onClose }: ToolCheckoutDialogProps) {
  const [loading, setLoading] = useState(false);
  const [tool, setTool] = useState<any>(null);
  const [borrowerSearch, setBorrowerSearch] = useState('');
  const [selectedBorrower, setSelectedBorrower] = useState<any>(null);
  const [borrowerResults, setBorrowerResults] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [customDueHours, setCustomDueHours] = useState<number | null>(null);
  const [showStaffAuth, setShowStaffAuth] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && toolId) {
      fetchTool();
    }
  }, [isOpen, toolId]);

  useEffect(() => {
    const searchBorrowers = async () => {
      if (borrowerSearch.length < 2) {
        setBorrowerResults([]);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, is_staff')
        .or(`full_name.ilike.%${borrowerSearch}%, email.ilike.%${borrowerSearch}%`)
        .limit(10);

      if (!error) {
        setBorrowerResults(data || []);
      }
    };

    const debounceTimer = setTimeout(searchBorrowers, 300);
    return () => clearTimeout(debounceTimer);
  }, [borrowerSearch]);

  const fetchTool = async () => {
    if (!toolId) return;

    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .eq('id', toolId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tool details",
        variant: "destructive"
      });
      return;
    }

    setTool(data);
    setCustomDueHours(data.default_due_hours || 24);
  };

  const handleCheckout = async () => {
    if (!tool || !selectedBorrower || !user) return;

    const checkout_at = new Date();
    const due_at = new Date(checkout_at.getTime() + (customDueHours || 24) * 60 * 60 * 1000);

    setCheckoutData({
      tool_id: tool.id,
      user_id: user.id,
      borrower_user_id: selectedBorrower.id,
      checkout_at: checkout_at.toISOString(),
      due_at: due_at.toISOString(),
      notes: notes.trim() || null,
      auth_method: 'manual'
    });

    setShowStaffAuth(true);
  };

  const completeCheckout = async (staffMember: any) => {
    if (!checkoutData) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tool_loans')
        .insert({
          ...checkoutData,
          issuer_user_id: staffMember.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Tool checked out to ${selectedBorrower.full_name || selectedBorrower.email}`
      });

      handleClose();
    } catch (error) {
      console.error('Error checking out tool:', error);
      toast({
        title: "Error",
        description: "Failed to check out tool",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTool(null);
    setBorrowerSearch('');
    setSelectedBorrower(null);
    setBorrowerResults([]);
    setNotes('');
    setCustomDueHours(null);
    setCheckoutData(null);
    onClose();
  };

  if (!tool) return null;

  return (
    <>
      <Dialog open={isOpen && !showStaffAuth} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Check Out Tool: {tool.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="borrower">Borrower *</Label>
              <Input
                id="borrower"
                value={borrowerSearch}
                onChange={(e) => setBorrowerSearch(e.target.value)}
                placeholder="Search by name or email"
              />
              
              {borrowerResults.length > 0 && (
                <div className="max-h-40 overflow-y-auto border rounded-md">
                  {borrowerResults.map((borrower) => (
                    <button
                      key={borrower.id}
                      type="button"
                      className="w-full text-left p-2 hover:bg-accent text-sm border-b last:border-b-0"
                      onClick={() => {
                        setSelectedBorrower(borrower);
                        setBorrowerSearch(borrower.full_name || borrower.email);
                        setBorrowerResults([]);
                      }}
                    >
                      <div className="font-medium">{borrower.full_name || borrower.email}</div>
                      {borrower.full_name && (
                        <div className="text-muted-foreground text-xs">{borrower.email}</div>
                      )}
                      {borrower.is_staff && (
                        <div className="text-blue-500 text-xs">Staff Member</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              {selectedBorrower && (
                <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                  Selected: {selectedBorrower.full_name || selectedBorrower.email}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_hours">Due Hours</Label>
              <Input
                id="due_hours"
                type="number"
                min="1"
                value={customDueHours || ''}
                onChange={(e) => setCustomDueHours(parseInt(e.target.value) || null)}
                placeholder="24"
              />
              <p className="text-sm text-muted-foreground">
                Tool will be due in {customDueHours || 24} hours
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this checkout"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button 
                onClick={handleCheckout} 
                disabled={loading || !selectedBorrower}
              >
                {loading ? 'Processing...' : 'Check Out Tool'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <StaffAuthDialog
        isOpen={showStaffAuth}
        onClose={() => setShowStaffAuth(false)}
        onStaffAuthenticated={completeCheckout}
        action="issue"
      />
    </>
  );
}