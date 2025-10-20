import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge, CreditCard, Fingerprint, KeyRound, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface StaffAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStaffAuthenticated: (staff: any) => void;
  action: 'receive' | 'issue';
  jobItemId?: number;
}

export function StaffAuthDialog({ isOpen, onClose, onStaffAuthenticated, action, jobItemId }: StaffAuthDialogProps) {
  const [loading, setLoading] = useState(false);
  const [badgeInput, setBadgeInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [staffCodeInput, setStaffCodeInput] = useState('');
  const [biometricData, setBiometricData] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const authenticateStaff = async (authMethod: string, authData: string) => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('is_staff', true)
        .eq('staff_active', true);

      // Apply different authentication methods (updated for security)
      switch (authMethod) {
        case 'badge':
          if (!authData || authData.trim().length === 0) {
            throw new Error('Badge ID cannot be empty');
          }
          query = query.eq('badge_id', authData.trim());
          break;
        case 'staff_code':
          if (!authData || authData.trim().length === 0) {
            throw new Error('Staff code cannot be empty');
          }
          query = query.eq('staff_code', authData.trim());
          break;
        case 'pin':
          // Security Update: PIN authentication disabled for security
          toast({
            title: "Security Update",
            description: "PIN authentication has been disabled for security. Please use Badge ID or Staff Code.",
            variant: "destructive",
          });
          return;
        case 'biometric':
          // Security Update: Biometric authentication disabled for security
          toast({
            title: "Security Update", 
            description: "Biometric authentication has been disabled for security. Please use Badge ID or Staff Code.",
            variant: "destructive",
          });
          return;
        default:
          throw new Error('Invalid authentication method. Use Badge ID or Staff Code only.');
      }

      const { data: staff, error } = await query.maybeSingle(); // Use maybeSingle for safer access

      if (error || !staff) {
        toast({
          title: "Authentication Failed",
          description: "Staff member not found or inactive",
          variant: "destructive"
        });
        return;
      }

      // Log the authentication
      const { error: logError } = await supabase
        .from('staff_auth_log')
        .insert({
          staff_id: staff.id,
          auth_method: authMethod,
          auth_data: authData,
          job_item_id: jobItemId,
          action,
          user_id: user.id
        });

      if (logError) {
        console.error('Error logging staff auth:', logError);
      }

      onStaffAuthenticated(staff);
      onClose();
      
      toast({
        title: "Authentication Successful",
        description: `${staff.full_name || staff.email} authenticated for ${action}`
      });

    } catch (error) {
      console.error('Staff authentication error:', error);
      toast({
        title: "Error",
        description: "Failed to authenticate staff",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBadgeScan = () => {
    if (!badgeInput.trim()) {
      toast({
        title: "Error",
        description: "Please scan or enter badge ID",
        variant: "destructive"
      });
      return;
    }
    authenticateStaff('badge', badgeInput);
  };

  const handlePinAuth = () => {
    if (!pinInput.trim()) {
      toast({
        title: "Error", 
        description: "Please enter PIN",
        variant: "destructive"
      });
      return;
    }
    authenticateStaff('pin', pinInput);
  };

  const handleStaffCodeAuth = () => {
    if (!staffCodeInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter staff code",
        variant: "destructive"
      });
      return;
    }
    authenticateStaff('staff_code', staffCodeInput);
  };

  const handleBiometricAuth = () => {
    // Simulate biometric scan
    toast({
      title: "Biometric Scan",
      description: "Place finger on scanner...",
    });
    
    // In real implementation, this would integrate with biometric hardware
    setTimeout(() => {
      if (biometricData) {
        authenticateStaff('biometric', biometricData);
      } else {
        toast({
          title: "Scan Failed",
          description: "Biometric scan failed, please try again",
          variant: "destructive"
        });
      }
    }, 2000);
  };

  const resetInputs = () => {
    setBadgeInput('');
    setPinInput('');
    setStaffCodeInput('');
    setBiometricData('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetInputs();
        onClose();
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Staff Authentication - {action === 'receive' ? 'Receiving' : 'Issuing'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="badge" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="badge">Badge</TabsTrigger>
            <TabsTrigger value="pin">PIN</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="biometric">Bio</TabsTrigger>
          </TabsList>

          <TabsContent value="badge" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="badge">Badge Scan</Label>
              <div className="flex gap-2">
                <Input
                  id="badge"
                  type="text"
                  placeholder="Scan badge or enter Badge ID"
                  value={badgeInput}
                  onChange={(e) => setBadgeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBadgeScan()}
                  autoFocus
                />
                <Button onClick={handleBadgeScan} disabled={loading}>
                  <CreditCard className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pin" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">Staff PIN</Label>
              <div className="flex gap-2">
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter PIN"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePinAuth()}
                  maxLength={10}
                />
                <Button onClick={handlePinAuth} disabled={loading}>
                  <KeyRound className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="code" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staffCode">Staff Code</Label>
              <div className="flex gap-2">
                <Input
                  id="staffCode"
                  type="text"
                  placeholder="Enter Staff Code"
                  value={staffCodeInput}
                  onChange={(e) => setStaffCodeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleStaffCodeAuth()}
                />
                <Button onClick={handleStaffCodeAuth} disabled={loading}>
                  <Badge className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="biometric" className="space-y-4">
            <div className="space-y-4 text-center">
              <div className="p-6 border-2 border-dashed rounded-lg">
                <Fingerprint className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to start biometric scan
                </p>
              </div>
              <Button 
                onClick={handleBiometricAuth} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Scanning...' : 'Start Biometric Scan'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}