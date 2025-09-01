import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { TabbedJobInterface } from "./TabbedJobInterface";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface JobCardEditorProps {
  jobId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface JobItem {
  item_id: number;
  description: string;
  qty: number;
  unit_cost: number;
  fitting_price: number;
  total_cost: number;
  category: 'spare' | 'consumable' | 'owner_supplied';
  warehouse: string;
  uom: string;
  verified_by?: string;
  received_by?: string;
  issued_by_code?: string;
}

export function JobCardEditor({ jobId, open, onOpenChange, onSuccess }: JobCardEditorProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch job details
  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job-details', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customers (
            name,
            email,
            phone,
            address
          )
        `)
        .eq('job_id', jobId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!jobId && open
  });

  // Fetch job items
  const { data: jobItems, isLoading: itemsLoading, refetch: refetchItems } = useQuery({
    queryKey: ['job-items', jobId],
    queryFn: async () => {
      if (!jobId) return [];
      
      const { data, error } = await supabase
        .from('job_items')
        .select('*')
        .eq('job_id', jobId)
        .order('item_id');
      
      if (error) throw error;
      return data as JobItem[];
    },
    enabled: !!jobId && open
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const { error } = await supabase
        .from('job_items')
        .delete()
        .eq('item_id', itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      refetchItems();
      toast({
        title: "Success",
        description: "Job item deleted successfully"
      });
    }
  });

  const handleDeleteItem = (itemId: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'spare': return 'bg-blue-500';
      case 'consumable': return 'bg-green-500';
      case 'owner_supplied': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const groupedItems = jobItems?.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, JobItem[]>) || {};

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Edit Job Card {job?.job_no}
          </DialogTitle>
        </DialogHeader>

        {jobLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Job Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Job Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Job Number</Label>
                  <p className="font-medium">{job?.job_no}</p>
                </div>
                <div>
                  <Label>Aircraft Registration</Label>
                  <p className="font-medium">{job?.aircraft_reg}</p>
                </div>
                <div>
                  <Label>Date Opened</Label>
                  <p className="font-medium">{job?.date_opened ? format(new Date(job.date_opened), 'PP') : 'N/A'}</p>
                </div>
                <div>
                  <Label>Customer</Label>
                  <p className="font-medium">{job?.customers?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getCategoryBadgeColor(job?.status || 'open')}>
                    {job?.status?.replace('_', ' ') || 'Open'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Scanning & Job Items Interface */}
            {jobId && (
              <TabbedJobInterface jobId={jobId} />
            )}
          </div>
        )}


      </DialogContent>
    </Dialog>
  );
}