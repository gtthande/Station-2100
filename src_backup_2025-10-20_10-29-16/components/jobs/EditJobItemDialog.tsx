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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

const jobItemSchema = z.object({
  description: z.string().optional(),
  qty: z.string().min(1, "Quantity is required"),
  uom: z.string().optional(),
  unit_cost: z.string().optional(),
  fitting_price: z.string().optional(),
  category: z.enum(["spare", "consumable", "owner_supplied"]),
  warehouse: z.string().optional(),
  stock_card_no: z.string().optional(),
  item_date: z.string().optional(),
  verified_by: z.string().optional(),
  received_by: z.string().optional(),
  issued_by_code: z.string().optional(),
  prepaid: z.boolean(),
});

type JobItemFormData = z.infer<typeof jobItemSchema>;

interface EditJobItemDialogProps {
  item: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditJobItemDialog({ item, open, onOpenChange, onSuccess }: EditJobItemDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<JobItemFormData>({
    resolver: zodResolver(jobItemSchema),
    defaultValues: {
      description: item?.description || "",
      qty: item?.qty?.toString() || "",
      uom: item?.uom || "",
      unit_cost: item?.unit_cost?.toString() || "",
      fitting_price: item?.fitting_price?.toString() || "",
      category: item?.category || "spare",
      warehouse: item?.warehouse || "",
      stock_card_no: item?.stock_card_no || "",
      item_date: item?.item_date || "",
      verified_by: item?.verified_by || "",
      received_by: item?.received_by || "",
      issued_by_code: item?.issued_by_code || "",
      prepaid: item?.prepaid || false,
    },
  });

  const onSubmit = async (data: JobItemFormData) => {
    if (!user?.id || !item?.item_id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("job_items")
        .update({
          ...data,
          qty: parseInt(data.qty),
          unit_cost: data.unit_cost ? parseFloat(data.unit_cost) : null,
          fitting_price: data.fitting_price ? parseFloat(data.fitting_price) : null,
          item_date: data.item_date || null,
        })
        .eq("item_id", item.item_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job item updated successfully",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update job item",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job Item</DialogTitle>
          <DialogDescription>
            Update job item details
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
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

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="qty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="uom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit of Measure</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="spare">Spare</SelectItem>
                        <SelectItem value="consumable">Consumable</SelectItem>
                        <SelectItem value="owner_supplied">Owner Supplied</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Cost</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fitting_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fitting Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="warehouse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warehouse</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock_card_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Card No.</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="item_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="verified_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verified By</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="received_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Received By</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="issued_by_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issued By Code</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prepaid"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Prepaid</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}