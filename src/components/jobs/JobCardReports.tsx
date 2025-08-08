import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Printer, Receipt, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { JobPart, GrandTotals } from '@/hooks/useJobCalculations';

interface JobCardReportsProps {
  isOpen?: boolean;
  onClose?: () => void;
  jobId?: number;
  jobCardId?: number;
  parts?: JobPart[];
  totals?: GrandTotals;
}

export function JobCardReports({ isOpen, onClose, jobId, parts, totals }: JobCardReportsProps) {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [finalizing, setFinalizing] = useState(false);
  const [reportType, setReportType] = useState<'customer' | 'internal'>('customer');
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFinalizeJob = async () => {
    if (!jobId || !user || !invoiceNumber.trim()) {
      toast({
        title: "Error",
        description: "Invoice number is required to finalize the job",
        variant: "destructive"
      });
      return;
    }

    setFinalizing(true);
    try {
      const { error } = await supabase
        .from('job_cards')
        .update({
          job_status: 'completed',
          invoice_number: invoiceNumber,
          finalized_at: new Date().toISOString(),
          finalized_by: user.id,
          closed: true,
          date_closed: new Date().toISOString()
        })
        .eq('jobcardid', jobId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Job Finalized",
        description: `Job #${jobId} has been completed with invoice ${invoiceNumber}`
      });

      onClose();

    } catch (error) {
      console.error('Error finalizing job:', error);
      toast({
        title: "Error",
        description: "Failed to finalize job",
        variant: "destructive"
      });
    } finally {
      setFinalizing(false);
    }
  };

  const generateReport = () => {
    const reportContent = generateReportContent();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generateReportContent = () => {
    const isCustomerCopy = reportType === 'customer';
    
    const warehouseAParts = parts.filter(p => p.warehouse_type === 'warehouse_a');
    const warehouseBCParts = parts.filter(p => p.warehouse_type === 'warehouse_bc');
    const ownerSuppliedParts = parts.filter(p => p.warehouse_type === 'owner_supplied');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Job Card Report #${jobId} - ${isCustomerCopy ? 'Customer Copy' : 'Internal Copy'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .section { margin: 20px 0; }
          .parts-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          .parts-table th, .parts-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .parts-table th { background-color: #f2f2f2; }
          .totals { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
          .footer { margin-top: 40px; font-size: 12px; color: #666; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Job Card Report #${jobId}</h1>
          <h2>${isCustomerCopy ? 'Customer Copy' : 'Internal Copy'}</h2>
          <p>Generated: ${new Date().toLocaleString()}</p>
          ${invoiceNumber ? `<p>Invoice: ${invoiceNumber}</p>` : ''}
        </div>

        <div class="section">
          <h3>Warehouse A - Aircraft Spares</h3>
          <table class="parts-table">
            <thead>
              <tr>
                <th>Part Number</th>
                <th>Description</th>
                <th>Quantity</th>
                ${!isCustomerCopy ? '<th>Cost Price</th>' : ''}
                <th>Fitting Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${warehouseAParts.map(part => `
                <tr>
                  <td>${part.partno}</td>
                  <td>${part.description}</td>
                  <td>${part.quantity}</td>
                  ${!isCustomerCopy ? `<td>$${part.cost_price.toFixed(2)}</td>` : ''}
                  <td>$${part.fitting_price.toFixed(2)}</td>
                  <td>$${(part.fitting_price * part.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h3>Warehouses B&C - Consumables</h3>
          <table class="parts-table">
            <thead>
              <tr>
                <th>Part Number</th>
                <th>Description</th>
                <th>Quantity</th>
                ${!isCustomerCopy ? '<th>Cost Price</th>' : ''}
                <th>Fitting Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${warehouseBCParts.map(part => `
                <tr>
                  <td>${part.partno}</td>
                  <td>${part.description}</td>
                  <td>${part.quantity}</td>
                  ${!isCustomerCopy ? `<td>$${part.cost_price.toFixed(2)}</td>` : ''}
                  <td>$${part.fitting_price.toFixed(2)}</td>
                  <td>$${(part.fitting_price * part.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h3>Owner Supplied Items</h3>
          <table class="parts-table">
            <thead>
              <tr>
                <th>Part Number</th>
                <th>Description</th>
                <th>Quantity</th>
                ${!isCustomerCopy ? '<th>Cost Price</th>' : ''}
                <th>Fitting Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${ownerSuppliedParts.map(part => `
                <tr>
                  <td>${part.partno}</td>
                  <td>${part.description}</td>
                  <td>${part.quantity}</td>
                  ${!isCustomerCopy ? `<td>$${part.cost_price.toFixed(2)}</td>` : ''}
                  <td>$${part.fitting_price.toFixed(2)}</td>
                  <td>$${(part.fitting_price * part.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="totals">
          <h3>Grand Totals</h3>
          ${!isCustomerCopy ? `<p>Total Cost Price: $${totals.total_cost.toFixed(2)}</p>` : ''}
          <p><strong>Total Fitting Price: $${totals.total_fitting.toFixed(2)}</strong></p>
          <p>Total Parts: ${totals.total_parts}</p>
        </div>

        ${notes ? `
        <div class="section">
          <h3>Notes</h3>
          <p>${notes}</p>
        </div>
        ` : ''}

        <div class="footer">
          <p>This is a ${isCustomerCopy ? 'customer' : 'internal'} copy of the job card report.</p>
          <p>Generated by: ${user?.email}</p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Job Card Finalization & Reports - Job #{jobId}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Finalization Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Finalize Job Card
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                <Input
                  id="invoiceNumber"
                  placeholder="Enter invoice number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Optional completion notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleFinalizeJob} 
                disabled={!invoiceNumber.trim() || finalizing}
                className="w-full"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                {finalizing ? 'Finalizing...' : 'Finalize Job Card'}
              </Button>
            </CardContent>
          </Card>

          {/* Reports Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Generate Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={reportType} onValueChange={(value) => setReportType(value as 'customer' | 'internal')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="customer">Customer Copy</TabsTrigger>
                  <TabsTrigger value="internal">Internal Copy</TabsTrigger>
                </TabsList>

                <TabsContent value="customer" className="mt-4">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Customer copy includes fitting prices only, without cost prices.
                    </p>
                    <Button onClick={generateReport} className="w-full">
                      <Printer className="w-4 h-4 mr-2" />
                      Print Customer Report
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="internal" className="mt-4">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Internal copy includes both cost prices and fitting prices for complete analysis.
                    </p>
                    <Button onClick={generateReport} className="w-full">
                      <Printer className="w-4 h-4 mr-2" />
                      Print Internal Report
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}