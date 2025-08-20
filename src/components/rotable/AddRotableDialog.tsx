import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRotableParts } from '@/hooks/useRotableParts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  serial_number: z.string().min(1, 'Serial number is required'),
  part_number: z.string().min(1, 'Part number is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  ata_chapter: z.string().optional(),
  status: z.enum(['installed', 'in_stock', 'sent_to_oem', 'awaiting_repair', 'serviceable', 'unserviceable']),
  description: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

interface AddRotableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddRotableDialog = ({ open, onOpenChange }: AddRotableDialogProps) => {
  const { createPart, isCreating } = useRotableParts();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serial_number: '',
      part_number: '',
      manufacturer: '',
      ata_chapter: '',
      status: 'in_stock',
      description: '',
      location: '',
      notes: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createPart({
      serial_number: values.serial_number,
      part_number: values.part_number,
      manufacturer: values.manufacturer,
      ata_chapter: values.ata_chapter,
      status: values.status,
      description: values.description,
      location: values.location,
      notes: values.notes,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-dark border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Rotable Part</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serial_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Serial Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Enter serial number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="part_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Part Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Enter part number"
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
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Manufacturer</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Enter manufacturer"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ata_chapter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">ATA Chapter</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="e.g., 32-41-02"
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-surface-dark border-white/10">
                        <SelectItem value="in_stock">In Stock</SelectItem>
                        <SelectItem value="installed">Installed</SelectItem>
                        <SelectItem value="sent_to_oem">Sent to OEM</SelectItem>
                        <SelectItem value="awaiting_repair">Awaiting Repair</SelectItem>
                        <SelectItem value="serviceable">Serviceable</SelectItem>
                        <SelectItem value="unserviceable">Unserviceable</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Location</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Storage location"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Part description"
                      rows={2}
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
                      placeholder="Additional notes"
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
                {isCreating ? 'Adding...' : 'Add Part'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};