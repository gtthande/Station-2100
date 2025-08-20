import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useComplianceDocuments } from '@/hooks/useComplianceDocuments';
import { useRotableParts } from '@/hooks/useRotableParts';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const documentSchema = z.object({
  rotable_part_id: z.string().min(1, 'Rotable part is required'),
  document_type: z.enum(['easa_certificate', 'faa_certificate', 'work_order', 'repair_certificate']),
  document_name: z.string().min(1, 'Document name is required'),
  document_url: z.string().url('Valid URL is required'),
  certificate_number: z.string().optional(),
  issue_date: z.date().optional(),
  expiry_date: z.date().optional(),
  issuing_authority: z.string().optional(),
  job_card_reference: z.string().optional(),
  work_order_reference: z.string().optional(),
  notes: z.string().optional(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rotablePartId?: string;
}

export const UploadDocumentDialog = ({ open, onOpenChange, rotablePartId }: UploadDocumentDialogProps) => {
  const { uploadDocument, isUploading } = useComplianceDocuments();
  const { rotableParts } = useRotableParts();
  const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      rotable_part_id: rotablePartId || '',
      document_type: 'easa_certificate',
      document_name: '',
      document_url: '',
      certificate_number: '',
      issuing_authority: '',
      job_card_reference: '',
      work_order_reference: '',
      notes: '',
    },
  });

  const onSubmit = async (data: DocumentFormData) => {
    try {
      const formattedData = {
        rotable_part_id: data.rotable_part_id,
        document_type: data.document_type,
        document_name: data.document_name,
        document_url: data.document_url,
        certificate_number: data.certificate_number,
        issue_date: data.issue_date ? format(data.issue_date, 'yyyy-MM-dd') : undefined,
        expiry_date: data.expiry_date ? format(data.expiry_date, 'yyyy-MM-dd') : undefined,
        issuing_authority: data.issuing_authority,
        job_card_reference: data.job_card_reference,
        work_order_reference: data.work_order_reference,
        notes: data.notes,
      };
      
      uploadDocument(formattedData);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error uploading document:', error);
    }
  };

  const documentTypeOptions = [
    { value: 'easa_certificate', label: 'EASA Certificate' },
    { value: 'faa_certificate', label: 'FAA Certificate' },
    { value: 'work_order', label: 'Work Order' },
    { value: 'repair_certificate', label: 'Repair Certificate' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Compliance Document
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rotable_part_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Rotable Part</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <SelectValue placeholder="Select part" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rotableParts.map((part) => (
                          <SelectItem key={part.id} value={part.id}>
                            {part.part_number} - {part.serial_number}
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
                name="document_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Document Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {documentTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="document_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Document Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Enter document name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="document_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Document URL</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                      placeholder="https://..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="certificate_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Certificate Number</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                        placeholder="Certificate number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issuing_authority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Issuing Authority</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                        placeholder="Issuing authority"
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
                name="issue_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-white">Issue Date</FormLabel>
                    <Popover open={showIssueDatePicker} onOpenChange={setShowIssueDatePicker}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal bg-white/5 border-white/20 text-white",
                              !field.value && "text-white/50"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
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
                          onSelect={(date) => {
                            field.onChange(date);
                            setShowIssueDatePicker(false);
                          }}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-white">Expiry Date</FormLabel>
                    <Popover open={showExpiryDatePicker} onOpenChange={setShowExpiryDatePicker}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal bg-white/5 border-white/20 text-white",
                              !field.value && "text-white/50"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
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
                          onSelect={(date) => {
                            field.onChange(date);
                            setShowExpiryDatePicker(false);
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="job_card_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Job Card Reference</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                        placeholder="Job card reference"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="work_order_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Work Order Reference</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                        placeholder="Work order reference"
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
                  <FormLabel className="text-white">Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Additional notes..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUploading}
                className="flex-1 gap-2"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};