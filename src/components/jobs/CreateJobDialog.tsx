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
  status: z.enum(["open", "awaiting_auth", "closed"]).default("open"),
});

type JobFormData = z.infer<typeof jobSchema>;

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateJobDialog({ open, onOpenChange }: CreateJobDialogProps) {
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
      job_no: "",
      aircraft_reg: "",
      customer_id: "",
      date_opened: new Date().toISOString().split("T")[0],
      status: "open",
    },
  });

  const onSubmit = async (data: JobFormData) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("jobs").insert({
        job_no: data.job_no,
        aircraft_reg: data.aircraft_reg,
        date_opened: data.date_opened,
        status: data.status,
        user_id: user.id,
        customer_id: data.customer_id || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job card created successfully",
      });

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create job card",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Job Card</DialogTitle>
          <DialogDescription>
            Create a new aircraft maintenance job card
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
                    <Input placeholder="JOB-001" {...field} />
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
                    <Input placeholder="N123AB" {...field} />
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
                  <FormLabel>Customer (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Job Card"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}