import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useInventoryPooling } from '@/hooks/useInventoryPooling';
import { useRotableParts } from '@/hooks/useRotableParts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  rotable_part_id: z.string().min(1, 'Please select a rotable part'),
  pool_name: z.string().min(1, 'Pool name is required'),
  pool_operator: z.string().optional(),
  sharing_agreement_ref: z.string().optional(),
  available_for_pool: z.boolean().default(false),
  pool_priority: z.number().int().min(1).max(10).default(1),
  usage_cost_per_hour: z.number().optional(),
  usage_cost_per_cycle: z.number().optional(),
  notes: z.string().optional(),
});

interface AddPooledPartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddPooledPartDialog = ({ open, onOpenChange }: AddPooledPartDialogProps) => {
  const { createPooledPart, isCreating } = useInventoryPooling();
  const { rotableParts } = useRotableParts();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rotable_part_id: '',
      pool_name: '',
      pool_operator: '',
      sharing_agreement_ref: '',
      available_for_pool: false,
      pool_priority: 1,
      usage_cost_per_hour: undefined,
      usage_cost_per_cycle: undefined,
      notes: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createPooledPart({
      rotable_part_id: values.rotable_part_id,
      pool_name: values.pool_name,
      pool_operator: values.pool_operator,
      sharing_agreement_ref: values.sharing_agreement_ref,
      available_for_pool: values.available_for_pool,
      pool_priority: values.pool_priority,
      usage_cost_per_hour: values.usage_cost_per_hour,
      usage_cost_per_cycle: values.usage_cost_per_cycle,
      notes: values.notes,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-dark border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Part to Pool</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rotable_part_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Rotable Part</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select rotable part" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-surface-dark border-white/10">
                      {rotableParts.map((part) => (
                        <SelectItem key={part.id} value={part.id}>
                          {part.serial_number} - {part.part_number}
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
                name="pool_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Pool Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="e.g., IATA Pool, Regional Pool"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pool_operator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Pool Operator</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Pool management company"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sharing_agreement_ref"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Sharing Agreement Reference</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Agreement reference number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="available_for_pool"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-white/80">Available for Pool</FormLabel>
                      <div className="text-xs text-white/60">Enable sharing</div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pool_priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Pool Priority (1-10)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        max="10"
                        className="bg-white/5 border-white/10 text-white"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="usage_cost_per_hour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Cost per Hour</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="0.00"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="usage_cost_per_cycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Cost per Cycle</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="0.00"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Additional notes about pooling arrangement"
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-white/10 text-white/80 hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Adding...' : 'Add to Pool'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};