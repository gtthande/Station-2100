import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFlightTracking } from '@/hooks/useFlightTracking';
import { useRotableParts } from '@/hooks/useRotableParts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  rotable_part_id: z.string().min(1, 'Please select a rotable part'),
  aircraft_tail_number: z.string().min(1, 'Aircraft tail number is required'),
  flight_hours: z.number().min(0, 'Flight hours must be 0 or greater'),
  flight_cycles: z.number().int().min(0, 'Flight cycles must be 0 or greater'),
  installation_date: z.string().optional(),
  calendar_time_limit_days: z.number().int().optional(),
  flight_hours_limit: z.number().optional(),
  flight_cycles_limit: z.number().int().optional(),
  next_inspection_due: z.string().optional(),
});

interface AddFlightTrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddFlightTrackingDialog = ({ open, onOpenChange }: AddFlightTrackingDialogProps) => {
  const { createTracking, isCreating } = useFlightTracking();
  const { rotableParts } = useRotableParts();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rotable_part_id: '',
      aircraft_tail_number: '',
      flight_hours: 0,
      flight_cycles: 0,
      installation_date: '',
      calendar_time_limit_days: undefined,
      flight_hours_limit: undefined,
      flight_cycles_limit: undefined,
      next_inspection_due: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createTracking({
      rotable_part_id: values.rotable_part_id,
      aircraft_tail_number: values.aircraft_tail_number,
      flight_hours: values.flight_hours,
      flight_cycles: values.flight_cycles,
      installation_date: values.installation_date || undefined,
      calendar_time_limit_days: values.calendar_time_limit_days,
      flight_hours_limit: values.flight_hours_limit,
      flight_cycles_limit: values.flight_cycles_limit,
      next_inspection_due: values.next_inspection_due || undefined,
      removal_date: undefined,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-dark border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Flight Tracking Record</DialogTitle>
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
                name="aircraft_tail_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Aircraft Tail Number</FormLabel>
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

              <FormField
                control={form.control}
                name="installation_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Installation Date</FormLabel>
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
                name="flight_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Flight Hours</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.1"
                        className="bg-white/5 border-white/10 text-white"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="flight_cycles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Flight Cycles</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        className="bg-white/5 border-white/10 text-white"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                name="calendar_time_limit_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Calendar Limit (Days)</FormLabel>
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

              <FormField
                control={form.control}
                name="flight_hours_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Hours Limit</FormLabel>
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
                name="flight_cycles_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">Cycles Limit</FormLabel>
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

            <FormField
              control={form.control}
              name="next_inspection_due"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/80">Next Inspection Due</FormLabel>
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