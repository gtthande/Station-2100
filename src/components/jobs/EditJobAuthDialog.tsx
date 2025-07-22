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
  ac_approved: z.boolean(),
  wb_bc_approved: z.boolean(),
  dss_approved: z.boolean(),
  closed_by: z.string().optional(),
  closed_at: z.string().optional(),
});

type JobAuthFormData = z.infer<typeof jobAuthSchema>;

interface EditJobAuthDialogProps {
  auth: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditJobAuthDialog({ auth, open, onOpenChange, onSuccess }: EditJobAuthDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<JobAuthFormData>({
    resolver: zodResolver(jobAuthSchema),
    defaultValues: {
      invoice_no: auth?.invoice_no || "",
      ac_approved: auth?.ac_approved || false,
      wb_bc_approved: auth?.wb_bc_approved || false,
      dss_approved: auth?.dss_approved || false,
      closed_by: auth?.closed_by || "",
      closed_at: auth?.closed_at ? new Date(auth.closed_at).toISOString().slice(0, 16) : "",
    },
  });

  const onSubmit = async (data: JobAuthFormData) => {
    if (!user?.id || !auth?.auth_id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("job_authorisations")
        .update({
          ...data,
          closed_at: data.closed_at ? new Date(data.closed_at).toISOString() : null,
        })
        .eq("auth_id", auth.auth_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job authorization updated successfully",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update job authorization",
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
          <DialogTitle>Edit Job Authorization</DialogTitle>
          <DialogDescription>
            Update authorization details
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
                    <Input {...field} />
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
                    <Input {...field} />
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
                {isLoading ? "Updating..." : "Update Authorization"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}