import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStockMovements } from '@/hooks/useStockMovements';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const openingBalanceSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  batch_id: z.string().optional(),
  movement_date: z.date(),
  quantity: z.coerce.number().min(0, 'Quantity must be positive'),
  unit_cost: z.coerce.number().min(0, 'Unit cost must be positive'),
  department_id: z.string().optional(),
  notes: z.string().optional(),
});

type OpeningBalanceForm = z.infer<typeof openingBalanceSchema>;

interface OpeningBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OpeningBalanceDialog({ open, onOpenChange }: OpeningBalanceDialogProps) {
  const { user } = useAuth();
  const { createMovement, isCreatingMovement, generateSourceRef } = useStockMovements();
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const form = useForm<OpeningBalanceForm>({
    resolver: zodResolver(openingBalanceSchema),
    defaultValues: {
      movement_date: new Date(),
      quantity: 0,
      unit_cost: 0,
    },
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['inventory-products', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('inventory_products')
        .select('id, part_number, description')
        .eq('user_id', user.id)
        .order('part_number');
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch batches for selected product
  const { data: batches = [] } = useQuery({
    queryKey: ['inventory-batches', user?.id, selectedProductId],
    queryFn: async () => {
      if (!user?.id || !selectedProductId) return [];
      const { data, error } = await supabase
        .from('inventory_batches')
        .select('id, batch_number')
        .eq('user_id', user.id)
        .eq('product_id', selectedProductId)
        .eq('status', 'approved')
        .order('batch_number');
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!selectedProductId,
  });

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ['departments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('departments')
        .select('id, department_name')
        .eq('user_id', user.id)
        .order('department_name');
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const onSubmit = async (data: OpeningBalanceForm) => {
    const sourceRef = generateSourceRef('OPEN_BALANCE', { productId: data.product_id });

    createMovement({
      product_id: data.product_id,
      batch_id: data.batch_id || null,
      movement_date: data.movement_date.toISOString().split('T')[0],
      event_type: 'OPEN_BALANCE',
      quantity: data.quantity,
      unit_cost: data.unit_cost,
      source_ref: sourceRef,
      department_id: data.department_id || null,
      notes: data.notes || null,
    });

    form.reset();
    setSelectedProductId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Opening Balance</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedProductId(value);
                      form.setValue('batch_id', '');
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.part_number} - {product.description}
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
              name="batch_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No specific batch</SelectItem>
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.batch_number}
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
              name="movement_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Cost</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="department_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.department_name}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingMovement}>
                {isCreatingMovement ? 'Recording...' : 'Record Opening Balance'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}