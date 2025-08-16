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
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
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
  const [editingItem, setEditingItem] = useState<JobItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<JobItem>>({
    category: 'spare',
    qty: 1,
    unit_cost: 0,
    fitting_price: 0
  });

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

  // Add/Update item mutation
  const saveItemMutation = useMutation({
    mutationFn: async (item: Partial<JobItem>) => {
      if (item.item_id) {
        // Update existing item
        const { error } = await supabase
          .from('job_items')
          .update({
            description: item.description,
            qty: item.qty,
            unit_cost: item.unit_cost,
            fitting_price: item.fitting_price,
            total_cost: (item.qty || 0) * (item.unit_cost || 0),
            category: item.category,
            warehouse: item.warehouse,
            uom: item.uom
          })
          .eq('item_id', item.item_id);
        
        if (error) throw error;
      } else {
        // Add new item
        const { error } = await supabase
          .from('job_items')
          .insert({
            job_id: jobId!,
            user_id: user!.id,
            description: item.description,
            qty: item.qty || 1,
            unit_cost: item.unit_cost || 0,
            fitting_price: item.fitting_price || 0,
            total_cost: (item.qty || 0) * (item.unit_cost || 0),
            category: item.category || 'spare',
            warehouse: item.warehouse,
            uom: item.uom || 'each'
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetchItems();
      setEditingItem(null);
      setNewItem({ category: 'spare', qty: 1, unit_cost: 0, fitting_price: 0 });
      toast({
        title: "Success",
        description: "Job item saved successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save job item",
        variant: "destructive"
      });
    }
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

  const handleSaveItem = (item: Partial<JobItem>) => {
    saveItemMutation.mutate(item);
  };

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

            {/* Job Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Job Items
                  <Button size="sm" onClick={() => setEditingItem({ ...newItem } as JobItem)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="spare" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="spare">Aircraft Spares</TabsTrigger>
                    <TabsTrigger value="consumable">Consumables</TabsTrigger>
                    <TabsTrigger value="owner_supplied">Owner Supplied</TabsTrigger>
                  </TabsList>

                  {(['spare', 'consumable', 'owner_supplied'] as const).map((category) => (
                    <TabsContent key={category} value={category}>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Unit Cost</TableHead>
                            <TableHead>Fitting Price</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Warehouse</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupedItems[category]?.map((item) => (
                            <TableRow key={item.item_id}>
                              <TableCell>{item.description}</TableCell>
                              <TableCell>{item.qty}</TableCell>
                              <TableCell>${item.unit_cost?.toFixed(2)}</TableCell>
                              <TableCell>${item.fitting_price?.toFixed(2)}</TableCell>
                              <TableCell className="font-medium">
                                ${((item.qty || 0) * (item.unit_cost || 0) + (item.fitting_price || 0)).toFixed(2)}
                              </TableCell>
                              <TableCell>{item.warehouse}</TableCell>
                              <TableCell className="space-x-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingItem(item)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteItem(item.item_id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )) || (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground">
                                No {category.replace('_', ' ')} items found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Item Dialog */}
        {editingItem && (
          <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingItem.item_id ? 'Edit' : 'Add'} Job Item
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    placeholder="Item description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="qty">Quantity</Label>
                    <Input
                      id="qty"
                      type="number"
                      value={editingItem.qty || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, qty: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="uom">Unit of Measure</Label>
                    <Input
                      id="uom"
                      value={editingItem.uom || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, uom: e.target.value })}
                      placeholder="each, lbs, etc."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="unit_cost">Unit Cost</Label>
                    <Input
                      id="unit_cost"
                      type="number"
                      step="0.01"
                      value={editingItem.unit_cost || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, unit_cost: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fitting_price">Fitting Price</Label>
                    <Input
                      id="fitting_price"
                      type="number"
                      step="0.01"
                      value={editingItem.fitting_price || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, fitting_price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={editingItem.category}
                      onValueChange={(value) => setEditingItem({ ...editingItem, category: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spare">Aircraft Spares</SelectItem>
                        <SelectItem value="consumable">Consumables</SelectItem>
                        <SelectItem value="owner_supplied">Owner Supplied</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="warehouse">Warehouse</Label>
                    <Input
                      id="warehouse"
                      value={editingItem.warehouse || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, warehouse: e.target.value })}
                      placeholder="Warehouse location"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditingItem(null)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleSaveItem(editingItem)}
                    disabled={saveItemMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Item
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}