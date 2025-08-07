import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, CheckCircle, Clock, AlertCircle, FileText, Printer } from "lucide-react";
import { JobCardApprovalPanel } from "./JobCardApprovalPanel";
import { JobCardReports } from "./JobCardReports";

interface JobCardFormData {
  customername: string;
  aircraft_regno: string;
  date_opened: string;
  remarks: string;
  description: string;
  custaddress?: string;
  custphone?: string;
  category?: string;
}

interface JobCardPart {
  partno: number;
  description: string | null;
  quantity: number | null;
  buying_price: number | null;
  fitting_price: number | null;
  issuedby: string | null;
  type: 'aircraft' | 'consumable' | 'owner_supplied';
  jobcardid: number;
  batch_no: string;
  department_id: number;
  cost_price?: number;
  fitting_cost?: number;
  approved?: boolean;
  approved_by?: string;
  approved_at?: string;
}

interface JobCardApproval {
  tab_name: 'warehouse_a' | 'warehouse_bc' | 'owner_supplied';
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  requires_invoice?: boolean;
  invoice_number?: string;
}

export function JobCardInterface() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentJobCardId, setCurrentJobCardId] = useState<number | null>(null);
  const [aircraftParts, setAircraftParts] = useState<JobCardPart[]>([]);
  const [consumableParts, setConsumableParts] = useState<JobCardPart[]>([]);
  const [ownerSuppliedParts, setOwnerSuppliedParts] = useState<JobCardPart[]>([]);
  const [approvals, setApprovals] = useState<JobCardApproval[]>([]);
  const [jobStatus, setJobStatus] = useState<'draft' | 'submitted' | 'partially_approved' | 'fully_approved' | 'closed'>('draft');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasRole, isAdmin } = useUserRoles();

  const form = useForm<JobCardFormData>({
    defaultValues: {
      customername: "",
      aircraft_regno: "",
      date_opened: new Date().toISOString().split('T')[0],
      remarks: "",
      description: "",
      custaddress: "",
      custphone: "",
      category: ""
    }
  });

  const loadJobCardParts = async (jobCardId: number) => {
    try {
      const { data, error } = await supabase
        .from('jobcard_parts')
        .select('*')
        .eq('jobcardid', jobCardId);

      if (error) throw error;

      const parts = (data || []).map(part => ({
        ...part,
        buying_price: Number(part.buying_price) || 0,
        fitting_price: Number(part.fitting_price) || 0,
        cost_price: Number(part.buying_price) || 0,
        fitting_cost: Number(part.fitting_price) || 0,
        type: part.type as 'aircraft' | 'consumable' | 'owner_supplied'
      }));
      
      setAircraftParts(parts.filter(p => p.type === 'aircraft'));
      setConsumableParts(parts.filter(p => p.type === 'consumable'));
      setOwnerSuppliedParts(parts.filter(p => p.type === 'owner_supplied'));
    } catch (error) {
      console.error('Error loading job card parts:', error);
      toast({
        title: "Error",
        description: "Failed to load job card parts",
        variant: "destructive"
      });
    }
  };

  const onSubmit = async (data: JobCardFormData) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create job cards",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const jobCardData = {
        ...data,
        user_id: user.id,
        date_opened: new Date(data.date_opened).toISOString()
      };

      if (currentJobCardId) {
        // Update existing job card
        const { error } = await supabase
          .from('job_cards')
          .update(jobCardData)
          .eq('jobcardid', currentJobCardId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Job card updated successfully"
        });
      } else {
        // Create new job card
        const { data: newJobCard, error } = await supabase
          .from('job_cards')
          .insert([jobCardData])
          .select('jobcardid')
          .single();

        if (error) throw error;

        setCurrentJobCardId(newJobCard.jobcardid);
        toast({
          title: "Success",
          description: "Job card created successfully"
        });
      }
    } catch (error) {
      console.error('Error saving job card:', error);
      toast({
        title: "Error",
        description: "Failed to save job card",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePartField = async (partno: number, field: string, value: string | number, type: string) => {
    try {
      const { error } = await supabase
        .from('jobcard_parts')
        .update({ [field]: value })
        .eq('partno', partno)
        .eq('type', type);

      if (error) throw error;

      // Reload parts to reflect changes
      if (currentJobCardId) {
        await loadJobCardParts(currentJobCardId);
      }

      toast({
        title: "Success",
        description: "Part updated successfully"
      });
    } catch (error) {
      console.error('Error updating part:', error);
      toast({
        title: "Error",
        description: "Failed to update part",
        variant: "destructive"
      });
    }
  };

  const renderPartsTable = (parts: JobCardPart[], type: 'aircraft' | 'consumable' | 'owner_supplied', tabName: string) => {
    const isApproved = approvals.find(a => a.tab_name === tabName as any)?.approved || false;
    const canEdit = !isApproved || isAdmin();
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold">
              {tabName === 'warehouse_a' ? 'Aircraft Spares' : 
               tabName === 'warehouse_bc' ? 'Consumables' : 'Owner-Supplied Items'}
            </h3>
            {isApproved && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Approved
              </Badge>
            )}
          </div>
          {jobStatus !== 'draft' && (
            <JobCardApprovalPanel
              tabName={tabName as any}
              jobCardId={currentJobCardId!}
              onApprovalChange={loadJobCardApprovals}
            />
          )}
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Part No</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Quantity</TableHead>
              {type !== 'owner_supplied' && <TableHead>Cost Price</TableHead>}
              <TableHead>Fitting Price</TableHead>
              <TableHead>Issued By</TableHead>
              {type !== 'owner_supplied' && <TableHead>Total Cost</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {parts.map((part) => (
              <TableRow key={`${part.partno}-${type}`}>
                <TableCell>{part.partno}</TableCell>
                <TableCell>{part.description}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={part.quantity || 0}
                    onChange={(e) => updatePartField(part.partno, 'quantity', Number(e.target.value), type)}
                    className="w-20"
                    disabled={!canEdit}
                  />
                </TableCell>
                {type !== 'owner_supplied' && (
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={part.cost_price || 0}
                      onChange={(e) => updatePartField(part.partno, 'cost_price', Number(e.target.value), type)}
                      className="w-24"
                      disabled={!canEdit}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={part.fitting_cost || 0}
                    onChange={(e) => updatePartField(part.partno, 'fitting_cost', Number(e.target.value), type)}
                    className="w-24"
                    disabled={!canEdit}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={part.issuedby || ''}
                    onChange={(e) => updatePartField(part.partno, 'issuedby', e.target.value, type)}
                    className="w-32"
                    disabled={!canEdit}
                  />
                </TableCell>
                {type !== 'owner_supplied' && (
                  <TableCell className="font-medium">
                    ${((part.cost_price || 0) * (part.quantity || 0)).toFixed(2)}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {parts.length === 0 && (
              <TableRow>
                <TableCell colSpan={type !== 'owner_supplied' ? 7 : 5} className="text-center text-muted-foreground">
                  No parts found for this category
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  const loadJobCardApprovals = async () => {
    if (!currentJobCardId) return;
    
    try {
      const { data, error } = await supabase
        .from('job_cards')
        .select('*')
        .eq('jobcardid', currentJobCardId)
        .single();

      if (error) throw error;

      // Map existing approval fields to our new structure
      const approvalData: JobCardApproval[] = [
        {
          tab_name: 'warehouse_a',
          approved: data.ac_aproved || false,
          approved_by: data.ac_aproved_by,
          approved_at: data.ac_approvedate
        },
        {
          tab_name: 'warehouse_bc', 
          approved: data.whb_aproved || false,
          approved_by: data.whb_aproved_by,
          approved_at: data.whb_approvedate
        },
        {
          tab_name: 'owner_supplied',
          approved: data.oss_approved || false,
          approved_by: data.oss_approved_by,
          approved_at: data.oss_approvedate
        }
      ];

      setApprovals(approvalData);
      setInvoiceNumber(data.close_invoice || '');
      
      // Determine job status
      const allApproved = approvalData.every(a => a.approved);
      const someApproved = approvalData.some(a => a.approved);
      const isClosed = data.closed || false;
      
      if (isClosed) {
        setJobStatus('closed');
      } else if (allApproved) {
        setJobStatus('fully_approved');
      } else if (someApproved) {
        setJobStatus('partially_approved');
      } else {
        setJobStatus('submitted');
      }
    } catch (error) {
      console.error('Error loading approvals:', error);
    }
  };

  const submitForApproval = async () => {
    if (!currentJobCardId) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('job_cards')
        .update({ 
          printed: true, // Mark as submitted
          preparedate: new Date().toISOString()
        })
        .eq('jobcardid', currentJobCardId);

      if (error) throw error;

      setJobStatus('submitted');
      toast({
        title: "Success",
        description: "Job card submitted for approval"
      });
    } catch (error) {
      console.error('Error submitting job card:', error);
      toast({
        title: "Error",
        description: "Failed to submit job card",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closeJob = async () => {
    if (!currentJobCardId || !invoiceNumber.trim()) {
      toast({
        title: "Error", 
        description: "Invoice number is required to close the job",
        variant: "destructive"
      });
      return;
    }

    const allApproved = approvals.every(a => a.approved);
    if (!allApproved) {
      toast({
        title: "Error",
        description: "All tabs must be approved before closing the job",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('job_cards')
        .update({
          closed: true,
          close_invoice: invoiceNumber,
          date_closed: new Date().toISOString()
        })
        .eq('jobcardid', currentJobCardId);

      if (error) throw error;

      setJobStatus('closed');
      toast({
        title: "Success",
        description: "Job card closed successfully"
      });
    } catch (error) {
      console.error('Error closing job:', error);
      toast({
        title: "Error",
        description: "Failed to close job card",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentJobCardId) {
      loadJobCardParts(currentJobCardId);
      loadJobCardApprovals();
    }
  }, [currentJobCardId]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Card Management</h1>
          <p className="text-muted-foreground">
            Create and manage aircraft maintenance job cards
          </p>
        </div>
      </div>

      {/* Job Card Form */}
      <Card>
        <CardHeader>
          <CardTitle>Job Card Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customername">Customer Name</Label>
                <Input
                  id="customername"
                  {...form.register("customername", { required: "Customer name is required" })}
                  placeholder="Enter customer name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aircraft_regno">Aircraft Registration</Label>
                <Input
                  id="aircraft_regno"
                  {...form.register("aircraft_regno", { required: "Aircraft registration is required" })}
                  placeholder="Enter aircraft registration"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_opened">Date Opened</Label>
                <Input
                  id="date_opened"
                  type="date"
                  {...form.register("date_opened", { required: "Date opened is required" })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  {...form.register("category")}
                  placeholder="Enter category"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custaddress">Customer Address</Label>
                <Input
                  id="custaddress"
                  {...form.register("custaddress")}
                  placeholder="Enter customer address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custphone">Customer Phone</Label>
                <Input
                  id="custphone"
                  {...form.register("custphone")}
                  placeholder="Enter customer phone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Enter job description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                {...form.register("remarks")}
                placeholder="Enter remarks"
                rows={3}
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {currentJobCardId ? 'Update Job Card' : 'Create Job Card'}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Job Status and Actions */}
      {currentJobCardId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Job Status</span>
              <Badge variant={
                jobStatus === 'closed' ? 'default' :
                jobStatus === 'fully_approved' ? 'default' :
                jobStatus === 'partially_approved' ? 'secondary' :
                jobStatus === 'submitted' ? 'outline' : 'secondary'
              }>
                {jobStatus === 'draft' && <Clock className="w-3 h-3 mr-1" />}
                {jobStatus === 'submitted' && <AlertCircle className="w-3 h-3 mr-1" />}
                {(jobStatus === 'fully_approved' || jobStatus === 'closed') && <CheckCircle className="w-3 h-3 mr-1" />}
                {jobStatus.replace('_', ' ').toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              {jobStatus === 'draft' && (
                <Button onClick={submitForApproval} disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                  Submit for Approval
                </Button>
              )}
              
              {jobStatus === 'fully_approved' && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="invoice">Invoice Number:</Label>
                    <Input
                      id="invoice"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="Enter invoice number"
                      className="w-48"
                    />
                  </div>
                  <Button onClick={closeJob} disabled={isLoading || !invoiceNumber.trim()}>
                    {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Close Job
                  </Button>
                </div>
              )}
              
              {(jobStatus === 'closed' || jobStatus === 'fully_approved') && (
                <JobCardReports jobCardId={currentJobCardId} />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parts Management Tabs */}
      {currentJobCardId && (
        <Card>
          <CardHeader>
            <CardTitle>Job Card Parts</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="warehouse_a" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="warehouse_a" className="relative">
                  Warehouse A (Aircraft)
                  {approvals.find(a => a.tab_name === 'warehouse_a')?.approved && 
                    <CheckCircle className="w-4 h-4 ml-2 text-green-600" />}
                </TabsTrigger>
                <TabsTrigger value="warehouse_bc" className="relative">
                  Warehouses B & C
                  {approvals.find(a => a.tab_name === 'warehouse_bc')?.approved && 
                    <CheckCircle className="w-4 h-4 ml-2 text-green-600" />}
                </TabsTrigger>
                <TabsTrigger value="owner_supplied" className="relative">
                  Owner Supplied
                  {approvals.find(a => a.tab_name === 'owner_supplied')?.approved && 
                    <CheckCircle className="w-4 h-4 ml-2 text-green-600" />}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="warehouse_a" className="space-y-4">
                {renderPartsTable(aircraftParts, 'aircraft', 'warehouse_a')}
              </TabsContent>

              <TabsContent value="warehouse_bc" className="space-y-4">
                {renderPartsTable(consumableParts, 'consumable', 'warehouse_bc')}
              </TabsContent>

              <TabsContent value="owner_supplied" className="space-y-4">
                {renderPartsTable(ownerSuppliedParts, 'owner_supplied', 'owner_supplied')}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}