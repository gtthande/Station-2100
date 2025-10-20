import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

const jobAuthSchema = z.object({
  invoice_no: z.string().min(1, "Invoice number is required"),
  ac_approved: z.boolean().default(false),
  wb_bc_approved: z.boolean().default(false),
  dss_approved: z.boolean().default(false),
  closed_by: z.string().optional(),
  closed_at: z.string().optional(),
});

type JobAuthFormData = z.infer<typeof jobAuthSchema>;

interface CreateJobAuthDialogProps {
  jobId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateJobAuthDialog({ jobId, open, onOpenChange, onSuccess }: CreateJobAuthDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<JobAuthFormData>({
    resolver: zodResolver(jobAuthSchema),
    defaultValues: {
      invoice_no: "",
      ac_approved: false,
      wb_bc_approved: false,
      dss_approved: false,
      closed_by: "",
      closed_at: "",
    },
  });

  const onSubmit = async (data: JobAuthFormData) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("job_authorisations").insert({
        invoice_no: data.invoice_no,
        ac_approved: data.ac_approved,
        wb_bc_approved: data.wb_bc_approved,
        dss_approved: data.dss_approved,
        closed_by: data.closed_by || null,
        job_id: jobId,
        user_id: user.id,
        closed_at: data.closed_at ? new Date(data.closed_at).toISOString() : null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job authorization created successfully",
      });

      form.reset();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create job authorization",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Job Authorization</DialogTitle>
          <DialogDescription>
            Create authorization record for the job
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="invoice_no"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Number</FormLabel>
                  <FormControl>
                    <Input placeholder="INV-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="ac_approved"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>AC Approved</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="wb_bc_approved"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>WB/BC Approved</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dss_approved"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>DSS Approved</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="closed_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Closed By</FormLabel>
                  <FormControl>
                    <Input placeholder="Person name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="closed_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Closed At</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Authorization"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}