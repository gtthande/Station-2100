import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Edit, Trash2 } from "lucide-react";
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
import { CreateJobItemDialog } from "./CreateJobItemDialog";
import { EditJobItemDialog } from "./EditJobItemDialog";
import { toast } from "@/hooks/use-toast";

interface JobItemsListProps {
  selectedJobId: number | null;
}

export function JobItemsList({ selectedJobId }: JobItemsListProps) {
  const { user } = useAuth();
  const [createItemOpen, setCreateItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data: jobItems, isLoading, refetch } = useQuery({
    queryKey: ["job-items", user?.id, selectedJobId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from("job_items")
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

  const handleDelete = async (itemId: number) => {
    if (!confirm("Are you sure you want to delete this job item?")) return;

    const { error } = await supabase
      .from("job_items")
      .delete()
      .eq("item_id", itemId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete job item",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Job item deleted successfully",
      });
      refetch();
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "spare":
        return "bg-blue-500";
      case "consumable":
        return "bg-orange-500";
      case "owner_supplied":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return <div>Loading job items...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          {selectedJobId && (
            <p className="text-sm text-muted-foreground">
              Showing items for selected job
            </p>
          )}
        </div>
        <Button onClick={() => setCreateItemOpen(true)} disabled={!selectedJobId}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {!selectedJobId && (
        <div className="text-center py-8 text-muted-foreground">
          Select a job card to view and manage its items
        </div>
      )}

      {selectedJobId && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job No.</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>Total Cost</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobItems?.map((item) => (
              <TableRow key={item.item_id}>
                <TableCell className="font-medium">
                  {item.jobs?.job_no}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {item.description || "N/A"}
                </TableCell>
                <TableCell>
                  <Badge className={getCategoryColor(item.category)}>
                    {item.category}
                  </Badge>
                </TableCell>
                <TableCell>{item.qty} {item.uom}</TableCell>
                <TableCell>
                  {item.unit_cost ? `$${item.unit_cost}` : "N/A"}
                </TableCell>
                <TableCell>
                  {item.total_cost ? `$${item.total_cost}` : "N/A"}
                </TableCell>
                <TableCell>{item.warehouse || "N/A"}</TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingItem(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.item_id)}
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
        <CreateJobItemDialog
          jobId={selectedJobId}
          open={createItemOpen}
          onOpenChange={setCreateItemOpen}
          onSuccess={() => {
            refetch();
            setCreateItemOpen(false);
          }}
        />
      )}

      {editingItem && (
        <EditJobItemDialog
          item={editingItem}
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          onSuccess={() => {
            refetch();
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}