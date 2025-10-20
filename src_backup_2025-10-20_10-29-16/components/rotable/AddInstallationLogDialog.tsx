import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useInstallationRemovalLogs } from '@/hooks/useInstallationLogs';
import { useRotableParts } from '@/hooks/useRotableParts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  rotable_part_id: z.string().min(1, 'Please select a rotable part'),
  aircraft_id: z.string().min(1, 'Aircraft ID is required'),
  log_type: z.enum(['installation', 'removal']),
  log_date: z.string().min(1, 'Log date is required'),
  flight_hours_at_action: z.number().optional(),
  flight_cycles_at_action: z.number().int().optional(),
  performed_by_name: z.string().optional(),
  reason_for_removal: z.string().optional(),
  maintenance_reference: z.string().optional(),
  notes: z.string().optional(),
});

interface AddInstallationLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddInstallationLogDialog = ({ open, onOpenChange }: AddInstallationLogDialogProps) => {
  const { createLog, isCreating } = useInstallationRemovalLogs();
  const { rotableParts } = useRotableParts();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rotable_part_id: '',
      aircraft_id: '',
      log_type: 'installation',
      log_date: '',
      flight_hours_at_action: undefined,
      flight_cycles_at_action: undefined,
      performed_by_name: '',
      reason_for_removal: '',
      maintenance_reference: '',
      notes: '',
    },
  });

  const logType = form.watch('log_type');

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createLog({
      rotable_part_id: values.rotable_part_id,
      aircraft_id: values.aircraft_id,
      log_type: values.log_type,
      log_date: values.log_date,
      flight_hours_at_action: values.flight_hours_at_action,
      flight_cycles_at_action: values.flight_cycles_at_action,
      performed_by_name: values.performed_by_name,
      reason_for_removal: values.reason_for_removal,
      maintenance_reference: values.maintenance_reference,
      notes: values.notes,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-dark border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Installation/Removal Log</DialogTitle>
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
                name="log_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Log Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select log type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-surface-dark border-white/10">
                        <SelectItem value="installation">Installation</SelectItem>
                        <SelectItem value="removal">Removal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="aircraft_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Aircraft ID</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="e.g., N123AB"
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
                name="log_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Date</FormLabel>
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
                name="flight_hours_at_action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Flight Hours</FormLabel>
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
                name="flight_cycles_at_action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Flight Cycles</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="performed_by_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Performed By</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Technician name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maintenance_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Maintenance Reference</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Work order, AMM ref, etc."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {logType === 'removal' && (
              <FormField
                control={form.control}
                name="reason_for_removal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Reason for Removal</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Reason for removing the part"
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                {isCreating ? 'Adding...' : 'Add Log'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};