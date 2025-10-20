import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const jobSchema = z.object({
  job_no: z.string().min(1, "Job number is required"),
  aircraft_reg: z.string().min(1, "Aircraft registration is required"),
  customer_id: z.string().optional(),
  date_opened: z.string().min(1, "Date opened is required"),
  invoice_date: z.string().optional(),
  status: z.enum(["open", "awaiting_auth", "closed"]),
  total_fitting_cost: z.string().optional(),
  total_cost_price: z.string().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

interface EditJobDialogProps {
  job: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditJobDialog({ job, open, onOpenChange, onSuccess }: EditJobDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const { data: customers } = useQuery({
    queryKey: ["customers", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      job_no: job?.job_no || "",
      aircraft_reg: job?.aircraft_reg || "",
      customer_id: job?.customer_id || "",
      date_opened: job?.date_opened || "",
      invoice_date: job?.invoice_date || "",
      status: job?.status || "open",
      total_fitting_cost: job?.total_fitting_cost?.toString() || "",
      total_cost_price: job?.total_cost_price?.toString() || "",
    },
  });

  const onSubmit = async (data: JobFormData) => {
    if (!user?.id || !job?.job_id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("jobs")
        .update({
          ...data,
          customer_id: data.customer_id || null,
          invoice_date: data.invoice_date || null,
          total_fitting_cost: data.total_fitting_cost ? parseFloat(data.total_fitting_cost) : null,
          total_cost_price: data.total_cost_price ? parseFloat(data.total_cost_price) : null,
        })
        .eq("job_id", job.job_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job card updated successfully",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update job card",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job Card</DialogTitle>
          <DialogDescription>
            Update job card details
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="job_no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aircraft_reg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aircraft Registration</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date_opened"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Opened</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoice_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="awaiting_auth">Awaiting Authorization</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="total_fitting_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Fitting Cost</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="total_cost_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Cost Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Job Card"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}