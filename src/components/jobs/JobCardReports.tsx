import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Printer, Download } from "lucide-react";

interface JobCardReportsProps {
  jobCardId: number;
}

interface JobCardData {
  customername: string;
  aircraft_regno: string;
  date_opened: string;
  description: string;
  close_invoice: string;
  parts: Array<{
    partno: number;
    description: string;
    quantity: number;
    cost_price: number;
    fitting_cost: number;
    type: string;
  }>;
}

export function JobCardReports({ jobCardId }: JobCardReportsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [jobData, setJobData] = useState<JobCardData | null>(null);
  const { toast } = useToast();

  const loadJobData = async () => {
    setIsLoading(true);
    try {
      const { data: jobCard, error: jobError } = await supabase
        .from('job_cards')
        .select('*')
        .eq('jobcardid', jobCardId)
        .single();

      if (jobError) throw jobError;

      const { data: parts, error: partsError } = await supabase
        .from('jobcard_parts')
        .select('*')
        .eq('jobcardid', jobCardId);

      if (partsError) throw partsError;

      setJobData({
        ...jobCard,
        parts: (parts || []).map(part => ({
          partno: Number(part.partno),
          description: part.description || '',
          quantity: Number(part.quantity) || 0,
          cost_price: Number(part.buying_price) || 0,
          fitting_cost: Number(part.fitting_price) || 0,
          type: part.type || 'aircraft'
        }))
      });
    } catch (error) {
      console.error('Error loading job data:', error);
      toast({
        title: "Error",
        description: "Failed to load job data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateCustomerReport = () => {
    if (!jobData) return;

    const customerParts = jobData.parts.filter(p => p.type !== 'owner_supplied');
    const totalFittingCost = customerParts.reduce((sum, part) => 
      sum + ((part.fitting_cost || 0) * (part.quantity || 0)), 0
    );

    return (
      <div className="p-6 bg-white text-black">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Job Card Report - Customer Copy</h1>
          <p className="text-sm text-gray-600">Invoice #{jobData.close_invoice}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p><strong>Customer:</strong> {jobData.customername}</p>
            <p><strong>Aircraft:</strong> {jobData.aircraft_regno}</p>
          </div>
          <div>
            <p><strong>Date Opened:</strong> {new Date(jobData.date_opened).toLocaleDateString()}</p>
            <p><strong>Job ID:</strong> {jobCardId}</p>
          </div>
        </div>

        <div className="mb-6">
          <p><strong>Description:</strong> {jobData.description}</p>
        </div>

        <table className="w-full border-collapse border border-gray-300 mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Part No</th>
              <th className="border border-gray-300 p-2 text-left">Description</th>
              <th className="border border-gray-300 p-2 text-center">Qty</th>
              <th className="border border-gray-300 p-2 text-right">Fitting Price</th>
              <th className="border border-gray-300 p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {customerParts.map((part, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2">{part.partno}</td>
                <td className="border border-gray-300 p-2">{part.description}</td>
                <td className="border border-gray-300 p-2 text-center">{part.quantity}</td>
                <td className="border border-gray-300 p-2 text-right">
                  ${(part.fitting_cost || 0).toFixed(2)}
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  ${((part.fitting_cost || 0) * (part.quantity || 0)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <td colSpan={4} className="border border-gray-300 p-2 text-right">Total:</td>
              <td className="border border-gray-300 p-2 text-right">${totalFittingCost.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  const generateInternalReport = () => {
    if (!jobData) return;

    const allParts = jobData.parts;
    const totalCostPrice = allParts.reduce((sum, part) => 
      sum + ((part.cost_price || 0) * (part.quantity || 0)), 0
    );
    const totalFittingCost = allParts.reduce((sum, part) => 
      sum + ((part.fitting_cost || 0) * (part.quantity || 0)), 0
    );

    return (
      <div className="p-6 bg-white text-black">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Job Card Report - Internal Copy</h1>
          <p className="text-sm text-gray-600">Invoice #{jobData.close_invoice}</p>
          <Badge variant="secondary" className="mt-2">CONFIDENTIAL - INTERNAL USE ONLY</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p><strong>Customer:</strong> {jobData.customername}</p>
            <p><strong>Aircraft:</strong> {jobData.aircraft_regno}</p>
          </div>
          <div>
            <p><strong>Date Opened:</strong> {new Date(jobData.date_opened).toLocaleDateString()}</p>
            <p><strong>Job ID:</strong> {jobCardId}</p>
          </div>
        </div>

        <div className="mb-6">
          <p><strong>Description:</strong> {jobData.description}</p>
        </div>

        <table className="w-full border-collapse border border-gray-300 mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Part No</th>
              <th className="border border-gray-300 p-2 text-left">Description</th>
              <th className="border border-gray-300 p-2 text-center">Qty</th>
              <th className="border border-gray-300 p-2 text-right">Cost Price</th>
              <th className="border border-gray-300 p-2 text-right">Fitting Price</th>
              <th className="border border-gray-300 p-2 text-left">Type</th>
              <th className="border border-gray-300 p-2 text-right">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {allParts.map((part, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2">{part.partno}</td>
                <td className="border border-gray-300 p-2">{part.description}</td>
                <td className="border border-gray-300 p-2 text-center">{part.quantity}</td>
                <td className="border border-gray-300 p-2 text-right">
                  ${(part.cost_price || 0).toFixed(2)}
                </td>
                <td className="border border-gray-300 p-2 text-right">
                  ${(part.fitting_cost || 0).toFixed(2)}
                </td>
                <td className="border border-gray-300 p-2 capitalize">{part.type}</td>
                <td className="border border-gray-300 p-2 text-right">
                  ${((part.cost_price || 0) * (part.quantity || 0)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <td colSpan={6} className="border border-gray-300 p-2 text-right">Total Cost:</td>
              <td className="border border-gray-300 p-2 text-right">${totalCostPrice.toFixed(2)}</td>
            </tr>
            <tr className="bg-blue-100 font-bold">
              <td colSpan={6} className="border border-gray-300 p-2 text-right">Total Fitting:</td>
              <td className="border border-gray-300 p-2 text-right">${totalFittingCost.toFixed(2)}</td>
            </tr>
            <tr className="bg-green-100 font-bold">
              <td colSpan={6} className="border border-gray-300 p-2 text-right">Profit Margin:</td>
              <td className="border border-gray-300 p-2 text-right">
                ${(totalFittingCost - totalCostPrice).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  const handlePrint = (content: React.ReactNode) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Job Card Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              @media print { 
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${printWindow.document.createElement('div').innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="flex gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" onClick={loadJobData} disabled={isLoading}>
            <FileText className="w-4 h-4 mr-2" />
            Customer Report
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Customer Report
              <Button 
                size="sm" 
                onClick={() => handlePrint(generateCustomerReport())}
                className="no-print"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </DialogTitle>
          </DialogHeader>
          {generateCustomerReport()}
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" onClick={loadJobData} disabled={isLoading}>
            <Download className="w-4 h-4 mr-2" />
            Internal Report
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Internal Report
              <Button 
                size="sm" 
                onClick={() => handlePrint(generateInternalReport())}
                className="no-print"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </DialogTitle>
          </DialogHeader>
          {generateInternalReport()}
        </DialogContent>
      </Dialog>
    </div>
  );
}