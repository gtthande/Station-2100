import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2 } from "lucide-react";

const stockCategorySchema = z.object({
  category_name: z.string().min(1, "Category name is required"),
});

type StockCategoryFormData = z.infer<typeof stockCategorySchema>;

interface StockCategory {
  id: string;
  category_name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function StockCategoryManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StockCategory | null>(null);

  const form = useForm<StockCategoryFormData>({
    resolver: zodResolver(stockCategorySchema),
    defaultValues: {
      category_name: "",
    },
  });

  const { data: stockCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['stock_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_categories')
        .select('*')
        .order('category_name');
      
      if (error) throw error;
      return data as StockCategory[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: StockCategoryFormData) => {
      const { error } = await supabase
        .from('stock_categories')
        .insert([{
          category_name: data.category_name,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_categories'] });
      toast.success("Stock category created successfully");
      form.reset();
      setIsCreateOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to create stock category");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: StockCategoryFormData }) => {
      const { error } = await supabase
        .from('stock_categories')
        .update({
          category_name: data.category_name,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_categories'] });
      toast.success("Stock category updated successfully");
      form.reset();
      setEditingCategory(null);
    },
    onError: (error) => {
      toast.error("Failed to update stock category");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('stock_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_categories'] });
      toast.success("Stock category deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete stock category");
    },
  });

  const onSubmit = (data: StockCategoryFormData) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (category: StockCategory) => {
    setEditingCategory(category);
    form.reset({
      category_name: category.category_name,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this stock category?")) {
      deleteMutation.mutate(id);
    }
  };

  if (categoriesLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div></div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Stock Category Management</CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Stock Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Stock Category</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="category_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter category name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Category"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category Name</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockCategories?.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.category_name}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Stock Category</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="category_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter category name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update Category"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}