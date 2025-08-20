import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRepairExchange } from '@/hooks/useRepairExchange';
import { useRotableParts } from '@/hooks/useRotableParts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  rotable_part_id: z.string().min(1, 'Please select a rotable part'),
  record_type: z.enum(['repair', 'exchange', 'overhaul']),
  sent_to_facility: z.string().min(1, 'Facility name is required'),
  sent_date: z.string().min(1, 'Sent date is required'),
  expected_return_date: z.string().optional(),
  actual_return_date: z.string().optional(),
  cost: z.number().optional(),
  warranty_expiry_date: z.string().optional(),
  warranty_terms: z.string().optional(),
  new_tso_hours: z.number().optional(),
  new_tso_cycles: z.number().int().optional(),
  exchange_part_serial: z.string().optional(),
  work_order_number: z.string().optional(),
  certification_reference: z.string().optional(),
  status: z.enum(['sent', 'in_progress', 'completed', 'returned']),
  notes: z.string().optional(),
});

interface AddRepairExchangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddRepairExchangeDialog = ({ open, onOpenChange }: AddRepairExchangeDialogProps) => {
  const { createRecord, isCreating } = useRepairExchange();
  const { rotableParts } = useRotableParts();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rotable_part_id: '',
      record_type: 'repair',
      sent_to_facility: '',
      sent_date: '',
      expected_return_date: '',
      actual_return_date: '',
      cost: undefined,
      warranty_expiry_date: '',
      warranty_terms: '',
      new_tso_hours: undefined,
      new_tso_cycles: undefined,
      exchange_part_serial: '',
      work_order_number: '',
      certification_reference: '',
      status: 'sent',
      notes: '',
    },
  });

  const recordType = form.watch('record_type');

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createRecord({
      rotable_part_id: values.rotable_part_id,
      record_type: values.record_type,
      sent_to_facility: values.sent_to_facility,
      sent_date: values.sent_date,
      expected_return_date: values.expected_return_date,
      actual_return_date: values.actual_return_date,
      cost: values.cost,
      warranty_expiry_date: values.warranty_expiry_date,
      warranty_terms: values.warranty_terms,
      new_tso_hours: values.new_tso_hours,
      new_tso_cycles: values.new_tso_cycles,
      exchange_part_serial: values.exchange_part_serial,
      work_order_number: values.work_order_number,
      certification_reference: values.certification_reference,
      status: values.status,
      notes: values.notes,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-dark border-white/10 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Repair/Exchange Record</DialogTitle>
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
                name="record_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Record Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select record type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-surface-dark border-white/10">
                        <SelectItem value="repair">Repair</SelectItem>
                        <SelectItem value="exchange">Exchange</SelectItem>
                        <SelectItem value="overhaul">Overhaul</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-surface-dark border-white/10">
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="returned">Returned</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sent_to_facility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Sent to Facility</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="OEM/MRO facility name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sent_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Sent Date</FormLabel>
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

              <FormField
                control={form.control}
                name="expected_return_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Expected Return Date</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="actual_return_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Actual Return Date</FormLabel>
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

              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Cost</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="warranty_expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Warranty Expiry Date</FormLabel>
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

              <FormField
                control={form.control}
                name="work_order_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Work Order Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Work order reference"
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
                name="new_tso_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">New TSO Hours</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.1"
                        className="bg-white/5 border-white/10 text-white"
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
                name="new_tso_cycles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">New TSO Cycles</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        className="bg-white/5 border-white/10 text-white"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {recordType === 'exchange' && (
              <FormField
                control={form.control}
                name="exchange_part_serial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Exchange Part Serial Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Serial number of exchanged part"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="warranty_terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Warranty Terms</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Warranty terms and conditions"
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
                {isCreating ? 'Adding...' : 'Add Record'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};