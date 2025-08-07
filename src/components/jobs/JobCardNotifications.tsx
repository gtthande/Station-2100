import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle, AlertCircle, X } from "lucide-react";

interface PendingApproval {
  jobcardid: number;
  customername: string;
  aircraft_regno: string;
  tab_name: string;
  submitted_date: string;
}

export function JobCardNotifications() {
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();
  const { isAdmin, hasRole } = useUserRoles();

  const canApprove = isAdmin() || hasRole('supervisor');

  const { data: pendingApprovals, isLoading } = useQuery({
    queryKey: ['pending-job-approvals', user?.id],
    queryFn: async () => {
      if (!user?.id || !canApprove) return [];

      const { data: jobCards, error } = await supabase
        .from('job_cards')
        .select('jobcardid, customername, aircraft_regno, ac_aproved, whb_aproved, oss_approved, preparedate, printed')
        .eq('user_id', user.id)
        .eq('printed', true)
        .eq('closed', false);

      if (error) throw error;

      const pending: PendingApproval[] = [];
      
      jobCards?.forEach(job => {
        if (!job.ac_aproved) {
          pending.push({
            jobcardid: job.jobcardid,
            customername: job.customername,
            aircraft_regno: job.aircraft_regno,
            tab_name: 'Aircraft Parts (Warehouse A)',
            submitted_date: job.preparedate || ''
          });
        }
        if (!job.whb_aproved) {
          pending.push({
            jobcardid: job.jobcardid,
            customername: job.customername,
            aircraft_regno: job.aircraft_regno,
            tab_name: 'Consumables (Warehouses B & C)',
            submitted_date: job.preparedate || ''
          });
        }
        if (!job.oss_approved) {
          pending.push({
            jobcardid: job.jobcardid,
            customername: job.customername,
            aircraft_regno: job.aircraft_regno,
            tab_name: 'Owner Supplied',
            submitted_date: job.preparedate || ''
          });
        }
      });

      return pending;
    },
    enabled: !!user && canApprove,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const pendingCount = pendingApprovals?.length || 0;

  useEffect(() => {
    if (pendingCount > 0 && !isVisible) {
      setIsVisible(true);
    }
  }, [pendingCount, isVisible]);

  if (!canApprove || pendingCount === 0) {
    return null;
  }

  return (
    <>
      {/* Notification Bell in Header */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(!isVisible)}
          className="relative bg-white shadow-lg"
        >
          <Bell className="w-4 h-4" />
          {pendingCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {pendingCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Notification Panel */}
      {isVisible && (
        <Card className="fixed top-16 right-4 w-80 z-40 shadow-xl bg-white border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-sm">Pending Approvals</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-auto">
              {pendingApprovals?.map((approval, index) => (
                <div
                  key={`${approval.jobcardid}-${approval.tab_name}-${index}`}
                  className="p-2 bg-orange-50 rounded-md border border-orange-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">
                        Job #{approval.jobcardid}
                      </p>
                      <p className="text-xs text-gray-600">
                        {approval.customername} • {approval.aircraft_regno}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {approval.tab_name}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Submitted: {approval.submitted_date ? 
                      new Date(approval.submitted_date).toLocaleDateString() : 
                      'Recently'
                    }
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                {pendingCount} approval{pendingCount !== 1 ? 's' : ''} pending
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}