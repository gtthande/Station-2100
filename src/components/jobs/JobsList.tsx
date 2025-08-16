import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { EditJobDialog } from "./EditJobDialog";
import { toast } from "@/hooks/use-toast";

interface JobsListProps {
  onSelectJob: (jobId: number) => void;
  onEditJob?: (jobId: number) => void;
}

export function JobsList({ onSelectJob, onEditJob }: JobsListProps) {
  const { user } = useAuth();
  const [editingJob, setEditingJob] = useState<any>(null);

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ["jobs", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          customers (
            name
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calculate costs for each job
      const jobsWithCosts = await Promise.all((data || []).map(async (job) => {
        // Get job items for cost calculation
        const { data: items } = await supabase
          .from("job_items")
          .select("*")
          .eq("job_id", job.job_id);

        const warehouseACost = (items || []).filter(i => i.category === 'spare').reduce((sum, item) => sum + (item.total_cost || 0), 0);
        const warehouseBCCost = (items || []).filter(i => i.category === 'consumable').reduce((sum, item) => sum + (item.total_cost || 0), 0);
        const ownerSuppliedCost = (items || []).filter(i => i.category === 'owner_supplied').reduce((sum, item) => sum + (item.fitting_price || 0), 0);

        return {
          ...job,
          warehouse_a_cost: warehouseACost,
          warehouse_bc_cost: warehouseBCCost,
          owner_supplied_cost: ownerSuppliedCost
        };
      }));

      return jobsWithCosts;
    },
    enabled: !!user?.id,
  });

  const handleDelete = async (jobId: number) => {
    if (!confirm("Are you sure you want to delete this job card?")) return;

    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("job_id", jobId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete job card",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Job card deleted successfully",
      });
      refetch();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500";
      case "awaiting_auth":
        return "bg-yellow-500";
      case "closed":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return <div>Loading jobs...</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job No.</TableHead>
            <TableHead>Aircraft Reg</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date Opened</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total Cost</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs?.map((job) => (
            <TableRow 
              key={job.job_id} 
              className="cursor-pointer hover:bg-muted/50"
              onDoubleClick={() => onEditJob ? onEditJob(job.job_id) : onSelectJob(job.job_id)}
            >
              <TableCell className="font-medium">{job.job_no}</TableCell>
              <TableCell>{job.aircraft_reg}</TableCell>
              <TableCell>{job.customers?.name || "N/A"}</TableCell>
              <TableCell>{format(new Date(job.date_opened), "PP")}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(job.status)}>
                  {job.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    WH-A: ${job.warehouse_a_cost || 0} | 
                    WH-BC: ${job.warehouse_bc_cost || 0} | 
                    Owner: ${job.owner_supplied_cost || 0}
                  </div>
                  <div className="font-medium">
                    Total: ${((job.total_cost_price || 0) + (job.total_fitting_cost || 0)).toFixed(2)}
                  </div>
                </div>
              </TableCell>
              <TableCell className="space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectJob(job.job_id);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditJob ? onEditJob(job.job_id) : setEditingJob(job);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(job.job_id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingJob && (
        <EditJobDialog
          job={editingJob}
          open={!!editingJob}
          onOpenChange={(open) => !open && setEditingJob(null)}
          onSuccess={() => {
            refetch();
            setEditingJob(null);
          }}
        />
      )}
    </div>
  );
}