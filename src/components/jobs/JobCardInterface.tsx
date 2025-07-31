import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

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
  buying_price: unknown;
  fitting_price: unknown;
  issuedby: string | null;
  type: string | null;
  jobcardid: number;
  batch_no: string;
  department_id: number;
}

export function JobCardInterface() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentJobCardId, setCurrentJobCardId] = useState<number | null>(null);
  const [aircraftParts, setAircraftParts] = useState<JobCardPart[]>([]);
  const [consumableParts, setConsumableParts] = useState<JobCardPart[]>([]);
  const [ownerSuppliedParts, setOwnerSuppliedParts] = useState<JobCardPart[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

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

      const parts = data || [];
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

  const renderPartsTable = (parts: JobCardPart[], type: string) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Part No</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Buying Price</TableHead>
          <TableHead>Fitting Price</TableHead>
          <TableHead>Issued By</TableHead>
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
              />
            </TableCell>
            <TableCell>{part.buying_price ? String(part.buying_price) : '-'}</TableCell>
            <TableCell>{part.fitting_price ? String(part.fitting_price) : '-'}</TableCell>
            <TableCell>
              <Input
                value={part.issuedby || ''}
                onChange={(e) => updatePartField(part.partno, 'issuedby', e.target.value, type)}
                className="w-32"
              />
            </TableCell>
          </TableRow>
        ))}
        {parts.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              No parts found for this category
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  useEffect(() => {
    if (currentJobCardId) {
      loadJobCardParts(currentJobCardId);
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

      {/* Parts Management Tabs */}
      {currentJobCardId && (
        <Card>
          <CardHeader>
            <CardTitle>Job Card Parts</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="aircraft" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="aircraft">Aircraft Parts</TabsTrigger>
                <TabsTrigger value="consumable">Consumables</TabsTrigger>
                <TabsTrigger value="owner_supplied">Owner Supplied</TabsTrigger>
              </TabsList>

              <TabsContent value="aircraft" className="space-y-4">
                <div className="rounded-md border">
                  {renderPartsTable(aircraftParts, 'aircraft')}
                </div>
              </TabsContent>

              <TabsContent value="consumable" className="space-y-4">
                <div className="rounded-md border">
                  {renderPartsTable(consumableParts, 'consumable')}
                </div>
              </TabsContent>

              <TabsContent value="owner_supplied" className="space-y-4">
                <div className="rounded-md border">
                  {renderPartsTable(ownerSuppliedParts, 'owner_supplied')}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}