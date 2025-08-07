import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface JobCardApprovalPanelProps {
  tabName: 'warehouse_a' | 'warehouse_bc' | 'owner_supplied';
  jobCardId: number;
  onApprovalChange: () => void;
}

export function JobCardApprovalPanel({ tabName, jobCardId, onApprovalChange }: JobCardApprovalPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { isAdmin, hasRole } = useUserRoles();
  const { toast } = useToast();

  const canApprove = isAdmin() || hasRole('supervisor');

  const handleApproval = async (approved: boolean) => {
    if (!canApprove) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to approve job cards",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const updateData: any = {};
      const timestamp = new Date().toISOString();

      switch (tabName) {
        case 'warehouse_a':
          updateData.ac_aproved = approved;
          updateData.ac_aproved_by = approved ? user?.email : null;
          updateData.ac_approvedate = approved ? timestamp : null;
          break;
        case 'warehouse_bc':
          updateData.whb_aproved = approved;
          updateData.whb_aproved_by = approved ? user?.email : null;
          updateData.whb_approvedate = approved ? timestamp : null;
          break;
        case 'owner_supplied':
          updateData.oss_approved = approved;
          updateData.oss_approved_by = approved ? user?.email : null;
          updateData.oss_approvedate = approved ? timestamp : null;
          break;
      }

      const { error } = await supabase
        .from('job_cards')
        .update(updateData)
        .eq('jobcardid', jobCardId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Tab ${approved ? 'approved' : 'unapproved'} successfully`
      });

      onApprovalChange();
    } catch (error) {
      console.error('Error updating approval:', error);
      toast({
        title: "Error",
        description: "Failed to update approval status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!canApprove) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Pending Approval
      </Badge>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleApproval(true)}
        disabled={isLoading}
        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
      >
        <CheckCircle className="w-3 h-3 mr-1" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleApproval(false)}
        disabled={isLoading}
        className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
      >
        <AlertCircle className="w-3 h-3 mr-1" />
        Reject
      </Button>
    </div>
  );
}