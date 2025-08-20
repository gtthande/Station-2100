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
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  rotable_part_id: z.string().min(1, 'Please select a rotable part'),
  warehouse_code: z.string().min(1, 'Warehouse code is required'),
  aisle: z.string().optional(),
  shelf: z.string().optional(),
  bin: z.string().optional(),
  moved_date: z.string().min(1, 'Moved date is required'),
  moved_by_name: z.string().optional(),
  notes: z.string().optional(),
});

interface AddLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddLocationDialog = ({ open, onOpenChange }: AddLocationDialogProps) => {
  const { createLocation, isCreating } = useInventoryPooling();
  const { rotableParts } = useRotableParts();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rotable_part_id: '',
      warehouse_code: '',
      aisle: '',
      shelf: '',
      bin: '',
      moved_date: new Date().toISOString().split('T')[0],
      moved_by_name: '',
      notes: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createLocation({
      rotable_part_id: values.rotable_part_id,
      warehouse_code: values.warehouse_code,
      aisle: values.aisle,
      shelf: values.shelf,
      bin: values.bin,
      is_current_location: true,
      moved_date: values.moved_date,
      moved_by_name: values.moved_by_name,
      notes: values.notes,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-dark border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Update Warehouse Location</DialogTitle>
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
                name="warehouse_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Warehouse Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="e.g., WH-01, MAIN, HGR-A"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="moved_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Moved Date</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="aisle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Aisle</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="e.g., A1, B2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shelf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Shelf</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="e.g., S1, TOP"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Bin</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="e.g., B001, LEFT"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="moved_by_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Moved By</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Name of person who moved the part"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      placeholder="Additional notes about the location change"
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
                {isCreating ? 'Updating...' : 'Update Location'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};