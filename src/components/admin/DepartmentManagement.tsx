import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2 } from "lucide-react";

const departmentSchema = z.object({
  department_name: z.string().min(1, "Department name is required"),
  department_description: z.string().optional(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

interface Department {
  id: string;
  department_name: string;
  department_description: string | null;
  created_at: string;
  updated_at: string;
}

export function DepartmentManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      department_name: "",
      department_description: "",
    },
  });

  // Fetch departments
  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("user_id", user.id)
        .order("department_name");

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Create department mutation
  const createMutation = useMutation({
    mutationFn: async (data: DepartmentFormData) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data: result, error } = await supabase
        .from("departments")
        .insert({
          department_name: data.department_name,
          department_description: data.department_description,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department created successfully");
      setIsCreateOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error("Failed to create department: " + error.message);
    },
  });

  // Update department mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DepartmentFormData }) => {
      const { data: result, error } = await supabase
        .from("departments")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department updated successfully");
      setEditingDepartment(null);
      form.reset();
    },
    onError: (error) => {
      toast.error("Failed to update department: " + error.message);
    },
  });

  // Delete department mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete department: " + error.message);
    },
  });

  const onSubmit = (data: DepartmentFormData) => {
    if (editingDepartment) {
      updateMutation.mutate({ id: editingDepartment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    form.setValue("department_name", department.department_name);
    form.setValue("department_description", department.department_description || "");
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this department?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div>Loading departments...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Department Management</CardTitle>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Department</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="department_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createMutation.isPending}>
                  Create Department
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((department) => (
              <TableRow key={department.id}>
                <TableCell>{department.department_name}</TableCell>
                <TableCell>{department.department_description || "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(department)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(department.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Edit Dialog */}
        <Dialog open={!!editingDepartment} onOpenChange={() => setEditingDepartment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="department_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={updateMutation.isPending}>
                  Update Department
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}