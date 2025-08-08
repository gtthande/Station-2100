import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, AlertTriangle, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useToast } from '@/hooks/use-toast';

interface JobCardApprovalPanelProps {
  jobId?: number;
  tabName?: string;
  onApprovalChange?: () => Promise<void>;
}

interface ApprovalStatus {
  warehouse_a_approved: boolean;
  warehouse_bc_approved: boolean;
  owner_supplied_approved: boolean;
  warehouse_a_approved_by?: string;
  warehouse_bc_approved_by?: string;
  owner_supplied_approved_by?: string;
  warehouse_a_approved_at?: string;
  warehouse_bc_approved_at?: string;
  owner_supplied_approved_at?: string;
  job_status: string;
}

export function JobCardApprovalPanel({ jobId, tabName, onApprovalChange }: JobCardApprovalPanelProps) {
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { hasRole, canManageSystem } = useUserRoles();
  const { toast } = useToast();

  const canApprove = canManageSystem() || hasRole('supervisor');

  useEffect(() => {
    if (jobId) {
      loadApprovalStatus();
    }
  }, [jobId]);

  const loadApprovalStatus = async () => {
    if (!jobId || !user) return;

    try {
      const { data, error } = await supabase
        .from('job_cards')
        .select(`
          warehouse_a_approved,
          warehouse_bc_approved,
          owner_supplied_approved,
          warehouse_a_approved_by,
          warehouse_bc_approved_by,
          owner_supplied_approved_by,
          warehouse_a_approved_at,
          warehouse_bc_approved_at,
          owner_supplied_approved_at,
          job_status
        `)
        .eq('jobcardid', jobId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setApprovalStatus(data);
    } catch (error) {
      console.error('Error loading approval status:', error);
      toast({
        title: "Error",
        description: "Failed to load approval status",
        variant: "destructive"
      });
    }
  };

  const handleApproval = async (tabType: 'warehouse_a' | 'warehouse_bc' | 'owner_supplied') => {
    if (!jobId || !user || !canApprove) return;

    setLoading(true);
    try {
      const updateData = {
        [`${tabType}_approved`]: true,
        [`${tabType}_approved_by`]: user.id,
        [`${tabType}_approved_at`]: new Date().toISOString()
      };

      const { error } = await supabase
        .from('job_cards')
        .update(updateData)
        .eq('jobcardid', jobId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Create notification
      await supabase
        .from('job_approval_notifications')
        .insert({
          job_id: jobId,
          tab_type: tabType,
          message: `${tabType.replace('_', ' ')} tab approved`,
          created_by: user.id,
          user_id: user.id
        });

      await loadApprovalStatus();
      if (onApprovalChange) {
        await onApprovalChange();
      }
      
      toast({
        title: "Approval Successful",
        description: `${tabType.replace('_', ' ')} tab has been approved`
      });

    } catch (error) {
      console.error('Error approving tab:', error);
      toast({
        title: "Error",
        description: "Failed to approve tab",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getApprovalBadge = (approved: boolean, approvedAt?: string) => {
    if (approved) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  const isFullyApproved = approvalStatus && 
    approvalStatus.warehouse_a_approved && 
    approvalStatus.warehouse_bc_approved && 
    approvalStatus.owner_supplied_approved;

  if (!jobId) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please select a job card to view approval status.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Job Card Approval Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {approvalStatus && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Warehouse A Approval */}
              <div className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Warehouse A</h4>
                  {getApprovalBadge(approvalStatus.warehouse_a_approved, approvalStatus.warehouse_a_approved_at)}
                </div>
                {!approvalStatus.warehouse_a_approved && canApprove && (
                  <Button 
                    size="sm" 
                    onClick={() => handleApproval('warehouse_a')}
                    disabled={loading}
                  >
                    Approve
                  </Button>
                )}
                {approvalStatus.warehouse_a_approved_at && (
                  <p className="text-xs text-muted-foreground">
                    Approved: {new Date(approvalStatus.warehouse_a_approved_at).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Warehouse BC Approval */}
              <div className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Warehouses B&C</h4>
                  {getApprovalBadge(approvalStatus.warehouse_bc_approved, approvalStatus.warehouse_bc_approved_at)}
                </div>
                {!approvalStatus.warehouse_bc_approved && canApprove && (
                  <Button 
                    size="sm" 
                    onClick={() => handleApproval('warehouse_bc')}
                    disabled={loading}
                  >
                    Approve
                  </Button>
                )}
                {approvalStatus.warehouse_bc_approved_at && (
                  <p className="text-xs text-muted-foreground">
                    Approved: {new Date(approvalStatus.warehouse_bc_approved_at).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Owner Supplied Approval */}
              <div className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Owner Supplied</h4>
                  {getApprovalBadge(approvalStatus.owner_supplied_approved, approvalStatus.owner_supplied_approved_at)}
                </div>
                {!approvalStatus.owner_supplied_approved && canApprove && (
                  <Button 
                    size="sm" 
                    onClick={() => handleApproval('owner_supplied')}
                    disabled={loading}
                  >
                    Approve
                  </Button>
                )}
                {approvalStatus.owner_supplied_approved_at && (
                  <p className="text-xs text-muted-foreground">
                    Approved: {new Date(approvalStatus.owner_supplied_approved_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* Overall Status */}
            {isFullyApproved && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  All tabs have been approved. This job card is ready for finalization.
                </AlertDescription>
              </Alert>
            )}

            {!canApprove && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You don't have permission to approve job cards. Contact your supervisor or administrator.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}