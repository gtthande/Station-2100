import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Printer, Plus, Trash2, Calculator, Package } from "lucide-react";
import { InventoryPartLookup } from "./InventoryPartLookup";

interface JobPart {
  id?: string;
  partno: string;
  description: string;
  quantity: number;
  cost_price: number;
  fitting_price: number;
  warehouse_type: 'warehouse_a' | 'warehouse_bc' | 'owner_supplied';
  job_id?: number;
  batch_id?: string;
  batch_number?: string;
}

interface TabTotals {
  warehouse_a: { cost_total: number; fitting_total: number; parts_count: number };
  warehouse_bc: { cost_total: number; fitting_total: number; parts_count: number };
  owner_supplied: { fitting_total: number; parts_count: number };
}

interface TabbedJobInterfaceProps {
  jobId?: number;
}

export function TabbedJobInterface({ jobId }: TabbedJobInterfaceProps) {
  const [parts, setParts] = useState<JobPart[]>([]);
  const [totals, setTotals] = useState<TabTotals>({
    warehouse_a: { cost_total: 0, fitting_total: 0, parts_count: 0 },
    warehouse_bc: { cost_total: 0, fitting_total: 0, parts_count: 0 },
    owner_supplied: { fitting_total: 0, parts_count: 0 }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [inventoryLookupOpen, setInventoryLookupOpen] = useState(false);
  const [selectedWarehouseType, setSelectedWarehouseType] = useState<'warehouse_a' | 'warehouse_bc' | 'owner_supplied'>('warehouse_a');
  const { user } = useAuth();
  const { toast } = useToast();

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

  const calculateTotals = () => {
    const newTotals: TabTotals = {
      warehouse_a: { cost_total: 0, fitting_total: 0, parts_count: 0 },
      warehouse_bc: { cost_total: 0, fitting_total: 0, parts_count: 0 },
      owner_supplied: { fitting_total: 0, parts_count: 0 }
    };

    parts.forEach(part => {
      const costTotal = part.cost_price * part.quantity;
      const fittingTotal = part.fitting_price * part.quantity;

      if (part.warehouse_type === 'warehouse_a') {
        newTotals.warehouse_a.cost_total += costTotal;
        newTotals.warehouse_a.fitting_total += fittingTotal;
        newTotals.warehouse_a.parts_count += 1;
      } else if (part.warehouse_type === 'warehouse_bc') {
        newTotals.warehouse_bc.cost_total += costTotal;
        newTotals.warehouse_bc.fitting_total += fittingTotal;
        newTotals.warehouse_bc.parts_count += 1;
      } else if (part.warehouse_type === 'owner_supplied') {
        newTotals.owner_supplied.fitting_total += fittingTotal;
        newTotals.owner_supplied.parts_count += 1;
      }
    });

    setTotals(newTotals);
  };

  const addNewPart = (warehouse_type: 'warehouse_a' | 'warehouse_bc' | 'owner_supplied') => {
    setSelectedWarehouseType(warehouse_type);
    setInventoryLookupOpen(true);
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
        // Insert new part
        const { data, error } = await supabase
          .from('job_items')
          .insert(partData)
          .select()
          .single();

        if (error) throw error;

        // Update the part with the real ID
        setParts(parts.map(p => 
          p.id === part.id 
            ? { ...part, id: data.item_id?.toString() }
            : p
        ));
      } else {
        // Update existing part
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

  const printTab = (warehouseType: 'warehouse_a' | 'warehouse_bc' | 'owner_supplied') => {
    const filteredParts = parts.filter(part => part.warehouse_type === warehouseType);
    const tabTotals = totals[warehouseType];
    const showCostPrice = warehouseType !== 'owner_supplied';
    
    const warehouseNames = {
      warehouse_a: 'Warehouse A - Aircraft Spares',
      warehouse_bc: 'Warehouses B & C - Consumables', 
      owner_supplied: 'Owner-Supplied Items'
    };

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${warehouseNames[warehouseType as keyof typeof warehouseNames]} - Job #${jobId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .totals { background-color: #e8f5e8; font-weight: bold; }
            .text-right { text-align: right; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>${warehouseNames[warehouseType as keyof typeof warehouseNames]}</h1>
          <p><strong>Job ID:</strong> ${jobId}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          
          <table>
            <thead>
              <tr>
                <th>Part No</th>
                <th>Description</th>
                <th>Quantity</th>
                ${showCostPrice ? '<th>Cost Price</th>' : ''}
                <th>Fitting Price</th>
                ${showCostPrice ? '<th>Total Cost</th>' : ''}
                <th>Total Fitting</th>
              </tr>
            </thead>
            <tbody>
              ${filteredParts.map(part => `
                <tr>
                  <td>${part.partno}</td>
                  <td>${part.description}</td>
                  <td class="text-right">${part.quantity}</td>
                  ${showCostPrice ? `<td class="text-right">$${part.cost_price.toFixed(2)}</td>` : ''}
                  <td class="text-right">$${part.fitting_price.toFixed(2)}</td>
                  ${showCostPrice ? `<td class="text-right">$${(part.cost_price * part.quantity).toFixed(2)}</td>` : ''}
                  <td class="text-right">$${(part.fitting_price * part.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="totals">
                <td colspan="${showCostPrice ? '5' : '3'}">TOTALS:</td>
                ${showCostPrice ? `<td class="text-right">$${('cost_total' in tabTotals ? tabTotals.cost_total : 0).toFixed(2)}</td>` : ''}
                <td class="text-right">$${tabTotals.fitting_total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          
          <div style="margin-top: 30px;">
            <p><strong>Parts Count:</strong> ${tabTotals.parts_count}</p>
            ${showCostPrice ? `<p><strong>Total Cost Price:</strong> $${('cost_total' in tabTotals ? tabTotals.cost_total : 0).toFixed(2)}</p>` : ''}
            <p><strong>Total Fitting Price:</strong> $${tabTotals.fitting_total.toFixed(2)}</p>
            ${showCostPrice ? `<p><strong>Profit Margin:</strong> $${(tabTotals.fitting_total - ('cost_total' in tabTotals ? tabTotals.cost_total : 0)).toFixed(2)}</p>` : ''}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const renderPartsTable = (warehouseType: 'warehouse_a' | 'warehouse_bc' | 'owner_supplied') => {
    const filteredParts = parts.filter(part => part.warehouse_type === warehouseType);
    const showCostPrice = warehouseType !== 'owner_supplied';

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              onClick={() => addNewPart(warehouseType)}
              size="sm"
              variant="outline"
              className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <Package className="w-4 h-4 mr-2" />
              From Inventory
            </Button>
            <Button
              onClick={() => addManualPart(warehouseType)}
              size="sm"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Manual Entry
            </Button>
          </div>
          <Button
            onClick={() => printTab(warehouseType)}
            size="sm"
            variant="outline"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Tab
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Part No</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Quantity</TableHead>
              {showCostPrice && <TableHead>Cost Price</TableHead>}
              <TableHead>Fitting Price</TableHead>
              {showCostPrice && <TableHead>Total Cost</TableHead>}
              <TableHead>Total Fitting</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParts.map((part) => (
              <TableRow key={part.id}>
                <TableCell>
                  <div className="space-y-1">
                    <Input
                      value={part.partno}
                      onChange={(e) => updatePart(part.id!, 'partno', e.target.value)}
                      placeholder="Part number"
                      className="w-32"
                    />
                    {part.batch_number && (
                      <div className="text-xs text-blue-600 font-mono">
                        Batch: {part.batch_number}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    value={part.description}
                    onChange={(e) => updatePart(part.id!, 'description', e.target.value)}
                    placeholder="Description"
                    className="w-48"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={part.quantity}
                    onChange={(e) => updatePart(part.id!, 'quantity', e.target.value)}
                    className="w-20"
                    min="0"
                  />
                </TableCell>
                {showCostPrice && (
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={part.cost_price}
                      onChange={(e) => updatePart(part.id!, 'cost_price', e.target.value)}
                      className="w-24"
                      min="0"
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={part.fitting_price}
                    onChange={(e) => updatePart(part.id!, 'fitting_price', e.target.value)}
                    className="w-24"
                    min="0"
                  />
                </TableCell>
                {showCostPrice && (
                  <TableCell className="font-medium">
                    ${(part.cost_price * part.quantity).toFixed(2)}
                  </TableCell>
                )}
                <TableCell className="font-medium">
                  ${(part.fitting_price * part.quantity).toFixed(2)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => savePart(part)}
                      disabled={!part.partno || !part.description}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePart(part.id!)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredParts.length === 0 && (
              <TableRow>
                <TableCell colSpan={showCostPrice ? 8 : 6} className="text-center text-muted-foreground py-8">
                  No parts added yet. Click "Add Part" to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Tab Totals */}
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">Tab Totals</span>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-gray-600">Parts: </span>
                  <Badge variant="secondary">{totals[warehouseType].parts_count}</Badge>
                </div>
                {showCostPrice && (
                  <div>
                    <span className="text-gray-600">Total Cost: </span>
                    <Badge variant="outline">${('cost_total' in totals[warehouseType] ? totals[warehouseType].cost_total : 0).toFixed(2)}</Badge>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Total Fitting: </span>
                  <Badge variant="default">${totals[warehouseType].fitting_total.toFixed(2)}</Badge>
                </div>
                {showCostPrice && (
                  <div>
                    <span className="text-gray-600">Profit: </span>
                    <Badge variant="default" className="bg-green-100 text-green-700">
                      ${(totals[warehouseType].fitting_total - ('cost_total' in totals[warehouseType] ? totals[warehouseType].cost_total : 0)).toFixed(2)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  useEffect(() => {
    if (jobId) {
      loadParts();
    }
  }, [jobId]);

  useEffect(() => {
    calculateTotals();
  }, [parts]);

  if (!jobId) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Please select a job to manage parts</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Parts Management - Job #{jobId}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="warehouse_a" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="warehouse_a" className="relative">
              Warehouse A - Aircraft Spares
              {totals.warehouse_a.parts_count > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {totals.warehouse_a.parts_count}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="warehouse_bc" className="relative">
              Warehouses B & C - Consumables
              {totals.warehouse_bc.parts_count > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {totals.warehouse_bc.parts_count}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="owner_supplied" className="relative">
              Owner-Supplied Items
              {totals.owner_supplied.parts_count > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {totals.owner_supplied.parts_count}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="warehouse_a" className="space-y-4">
            {renderPartsTable('warehouse_a')}
          </TabsContent>

          <TabsContent value="warehouse_bc" className="space-y-4">
            {renderPartsTable('warehouse_bc')}
          </TabsContent>

          <TabsContent value="owner_supplied" className="space-y-4">
            {renderPartsTable('owner_supplied')}
          </TabsContent>
        </Tabs>

        <InventoryPartLookup
          isOpen={inventoryLookupOpen}
          onClose={() => setInventoryLookupOpen(false)}
          onSelectPart={addInventoryPart}
          warehouseType={selectedWarehouseType}
        />
      </CardContent>
    </Card>
  );
}