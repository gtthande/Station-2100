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
  category: z.enum(["spare", "consumable", "owner_supplied"]).default("spare"),
  warehouse: z.string().optional(),
  stock_card_no: z.string().optional(),
  item_date: z.string().optional(),
  verified_by: z.string().optional(),
  received_by: z.string().optional(),
  issued_by_code: z.string().optional(),
  prepaid: z.boolean().default(false),
});

type JobItemFormData = z.infer<typeof jobItemSchema>;

interface CreateJobItemDialogProps {
  jobId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateJobItemDialog({ jobId, open, onOpenChange, onSuccess }: CreateJobItemDialogProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<JobItemFormData>({
    resolver: zodResolver(jobItemSchema),
    defaultValues: {
      description: "",
      qty: "",
      uom: "each",
      unit_cost: "",
      fitting_price: "",
      category: "spare",
      warehouse: "",
      stock_card_no: "",
      item_date: new Date().toISOString().split("T")[0],
      verified_by: "",
      received_by: "",
      issued_by_code: "",
      prepaid: false,
    },
  });

  const onSubmit = async (data: JobItemFormData) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const qty = parseInt(data.qty);
      const unitCost = data.unit_cost ? parseFloat(data.unit_cost) : 0;
      const fittingPrice = data.fitting_price ? parseFloat(data.fitting_price) : 0;
      const totalCost = qty * unitCost;

      const { error } = await supabase.from("job_items").insert({
        ...data,
        job_id: jobId,
        user_id: user.id,
        qty: qty,
        unit_cost: unitCost,
        fitting_price: fittingPrice,
        total_cost: totalCost,
        item_date: data.item_date || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job item created successfully",
      });

      form.reset();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create job item",
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
          <DialogTitle>Add Job Item</DialogTitle>
          <DialogDescription>
            Add a new item to the job card
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
                    <Textarea placeholder="Item description..." {...field} />
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
                      <Input type="number" placeholder="1" {...field} />
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
                      <Input placeholder="each" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                      <Input placeholder="Warehouse location" {...field} />
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
                      <Input placeholder="Stock card number" {...field} />
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
                      <Input placeholder="Verifier name" {...field} />
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
                      <Input placeholder="Receiver name" {...field} />
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
                      <Input placeholder="Issuer code" {...field} />
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
                {isLoading ? "Adding..." : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}