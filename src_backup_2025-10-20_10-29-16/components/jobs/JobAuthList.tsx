import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Edit, Trash2, CheckCircle } from "lucide-react";
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
import { CreateJobAuthDialog } from "./CreateJobAuthDialog";
import { EditJobAuthDialog } from "./EditJobAuthDialog";
import { toast } from "@/hooks/use-toast";

interface JobAuthListProps {
  selectedJobId: number | null;
}

export function JobAuthList({ selectedJobId }: JobAuthListProps) {
  const { user } = useAuth();
  const [createAuthOpen, setCreateAuthOpen] = useState(false);
  const [editingAuth, setEditingAuth] = useState<any>(null);

  const { data: jobAuths, isLoading, refetch } = useQuery({
    queryKey: ["job-authorisations", user?.id, selectedJobId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from("job_authorisations")
        .select(`
          *,
          jobs (
            job_no,
            aircraft_reg
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (selectedJobId) {
        query = query.eq("job_id", selectedJobId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleDelete = async (authId: number) => {
    if (!confirm("Are you sure you want to delete this authorization?")) return;

    const { error } = await supabase
      .from("job_authorisations")
      .delete()
      .eq("auth_id", authId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete authorization",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Authorization deleted successfully",
      });
      refetch();
    }
  };

  if (isLoading) {
    return <div>Loading authorizations...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          {selectedJobId && (
            <p className="text-sm text-muted-foreground">
              Showing authorizations for selected job
            </p>
          )}
        </div>
        <Button onClick={() => setCreateAuthOpen(true)} disabled={!selectedJobId}>
          <Plus className="mr-2 h-4 w-4" />
          Add Authorization
        </Button>
      </div>

      {!selectedJobId && (
        <div className="text-center py-8 text-muted-foreground">
          Select a job card to view and manage its authorizations
        </div>
      )}

      {selectedJobId && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job No.</TableHead>
              <TableHead>Invoice No.</TableHead>
              <TableHead>AC Approved</TableHead>
              <TableHead>WB/BC Approved</TableHead>
              <TableHead>DSS Approved</TableHead>
              <TableHead>Closed By</TableHead>
              <TableHead>Closed At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobAuths?.map((auth) => (
              <TableRow key={auth.auth_id}>
                <TableCell className="font-medium">
                  {auth.jobs?.job_no}
                </TableCell>
                <TableCell>{auth.invoice_no}</TableCell>
                <TableCell>
                  {auth.ac_approved ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {auth.wb_bc_approved ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {auth.dss_approved ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </TableCell>
                <TableCell>{auth.closed_by || "N/A"}</TableCell>
                <TableCell>
                  {auth.closed_at ? format(new Date(auth.closed_at), "PPP") : "N/A"}
                </TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingAuth(auth)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(auth.auth_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {selectedJobId && (
        <CreateJobAuthDialog
          jobId={selectedJobId}
          open={createAuthOpen}
          onOpenChange={setCreateAuthOpen}
          onSuccess={() => {
            refetch();
            setCreateAuthOpen(false);
          }}
        />
      )}

      {editingAuth && (
        <EditJobAuthDialog
          auth={editingAuth}
          open={!!editingAuth}
          onOpenChange={(open) => !open && setEditingAuth(null)}
          onSuccess={() => {
            refetch();
            setEditingAuth(null);
          }}
        />
      )}
    </div>
  );
}