import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Printer, Calculator } from "lucide-react";
import { JobPart, useJobCalculations } from "@/hooks/useJobCalculations";
import { WarehouseATab } from "./WarehouseATab";
import { WarehouseBCTab } from "./WarehouseBCTab";
import { OwnerSuppliedTab } from "./OwnerSuppliedTab";
import { JobTotalsCard } from "./JobTotalsCard";
import { Button } from "@/components/ui/button";

interface TabbedJobInterfaceProps {
  jobId?: number;
}

export function TabbedJobInterface({ jobId }: TabbedJobInterfaceProps) {
  const [parts, setParts] = useState<JobPart[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedWarehouseType, setSelectedWarehouseType] = useState<'warehouse_a' | 'warehouse_bc' | 'owner_supplied'>('warehouse_a');
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { totals, grandTotals } = useJobCalculations(parts);

  const loadParts = async () => {
    if (!jobId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_items')
        .select('*')
        .eq('job_id', jobId)
        .eq('user_id', user?.id);

      if (error) throw error;

      const loadedParts: JobPart[] = (data || []).map(item => ({
        id: item.item_id?.toString(),
        partno: item.stock_card_no || '',
        description: item.description || '',
        quantity: item.qty || 0,
        cost_price: Number(item.unit_cost) || 0,
        fitting_price: Number(item.fitting_price) || 0,
        warehouse_type: (item.category === 'spare' ? 'warehouse_a' : 
                       item.category === 'consumable' ? 'warehouse_bc' : 
                       'owner_supplied') as any,
        job_id: jobId
      }));

      setParts(loadedParts);
    } catch (error) {
      console.error('Error loading parts:', error);
      toast({
        title: "Error",
        description: "Failed to load job parts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addManualPart = (warehouse_type: 'warehouse_a' | 'warehouse_bc' | 'owner_supplied') => {
    const newPart: JobPart = {
      id: `temp_${Date.now()}`,
      partno: '',
      description: '',
      quantity: 1,
      cost_price: 0,
      fitting_price: 0,
      warehouse_type,
      job_id: jobId
    };
    setParts([...parts, newPart]);
  };

  const addInventoryPart = (inventoryPart: {
    part_number: string;
    description: string;
    quantity: number;
    cost_price: number;
    batch_id: string;
    batch_number: string;
  }) => {
    const newPart: JobPart = {
      id: `temp_${Date.now()}`,
      partno: inventoryPart.part_number,
      description: inventoryPart.description,
      quantity: inventoryPart.quantity,
      cost_price: inventoryPart.cost_price,
      fitting_price: 0,
      warehouse_type: selectedWarehouseType,
      job_id: jobId,
      batch_id: inventoryPart.batch_id,
      batch_number: inventoryPart.batch_number
    };
    setParts([...parts, newPart]);
  };

  const updatePart = (partId: string, field: keyof JobPart, value: string | number) => {
    setParts(parts.map(part => 
      part.id === partId 
        ? { ...part, [field]: field === 'quantity' || field === 'cost_price' || field === 'fitting_price' 
            ? Number(value) || 0 
            : value 
          }
        : part
    ));
  };

  const deletePart = (partId: string) => {
    setParts(parts.filter(part => part.id !== partId));
  };

  const savePart = async (part: JobPart) => {
    if (!jobId || !user?.id) return;

    try {
      const categoryValue = part.warehouse_type === 'warehouse_a' ? 'spare' as const : 
                           part.warehouse_type === 'warehouse_bc' ? 'consumable' as const : 
                           'owner_supplied' as const;

      const partData = {
        job_id: jobId,
        user_id: user.id,
        stock_card_no: part.partno,
        description: part.description,
        qty: part.quantity,
        unit_cost: part.cost_price,
        fitting_price: part.fitting_price,
        total_cost: part.cost_price * part.quantity,
        category: categoryValue
      };

      if (part.id?.startsWith('temp_')) {
        const { data, error } = await supabase
          .from('job_items')
          .insert(partData)
          .select()
          .single();

        if (error) throw error;

        setParts(parts.map(p => 
          p.id === part.id 
            ? { ...part, id: data.item_id?.toString() }
            : p
        ));
      } else {
        const { error } = await supabase
          .from('job_items')
          .update(partData)
          .eq('item_id', Number(part.id));

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Part saved successfully"
      });
    } catch (error) {
      console.error('Error saving part:', error);
      toast({
        title: "Error",
        description: "Failed to save part",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadParts();
  }, [jobId]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-6 h-6" />
              <span>Job Parts & Pricing Management</span>
              {jobId && <span className="text-muted-foreground">- Job #{jobId}</span>}
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print Complete Job
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      <JobTotalsCard totals={totals} grandTotals={grandTotals} />

      <Tabs defaultValue="warehouse_a" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="warehouse_a">Warehouse A ({totals.warehouse_a.parts_count})</TabsTrigger>
          <TabsTrigger value="warehouse_bc">Warehouses B&C ({totals.warehouse_bc.parts_count})</TabsTrigger>
          <TabsTrigger value="owner_supplied">Owner Supplied ({totals.owner_supplied.parts_count})</TabsTrigger>
        </TabsList>

        <TabsContent value="warehouse_a">
          <WarehouseATab
            parts={parts}
            totals={totals.warehouse_a}
            jobId={jobId}
            onAddInventoryPart={addInventoryPart}
            onAddManualPart={() => addManualPart('warehouse_a')}
            onUpdatePart={updatePart}
            onDeletePart={deletePart}
            onSavePart={savePart}
            onPrint={() => {}}
            barcodeInput={barcodeInput}
            setBarcodeInput={setBarcodeInput}
            onBarcodeKeyPress={() => {}}
            onScanForPart={() => {}}
          />
        </TabsContent>

        <TabsContent value="warehouse_bc">
          <WarehouseBCTab
            parts={parts}
            totals={totals.warehouse_bc}
            jobId={jobId}
            onAddInventoryPart={addInventoryPart}
            onAddManualPart={() => addManualPart('warehouse_bc')}
            onUpdatePart={updatePart}
            onDeletePart={deletePart}
            onSavePart={savePart}
            onPrint={() => {}}
            barcodeInput={barcodeInput}
            setBarcodeInput={setBarcodeInput}
            onBarcodeKeyPress={() => {}}
            onScanForPart={() => {}}
          />
        </TabsContent>

        <TabsContent value="owner_supplied">
          <OwnerSuppliedTab
            parts={parts}
            totals={totals.owner_supplied}
            jobId={jobId}
            onAddManualPart={() => addManualPart('owner_supplied')}
            onUpdatePart={updatePart}
            onDeletePart={deletePart}
            onSavePart={savePart}
            onPrint={() => {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}