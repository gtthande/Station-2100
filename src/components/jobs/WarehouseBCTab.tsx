import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Printer, Plus, Trash2, Package, Factory } from "lucide-react";
import { JobPart, useJobCalculations } from "@/hooks/useJobCalculations";
import { InventoryPartLookup } from "./InventoryPartLookup";

interface WarehouseBCTabProps {
  parts: JobPart[];
  totals: any;
  jobId?: number;
  onAddInventoryPart: (part: any) => void;
  onAddManualPart: () => void;
  onUpdatePart: (partId: string, field: keyof JobPart, value: string | number) => void;
  onDeletePart: (partId: string) => void;
  onSavePart: (part: JobPart) => void;
  onPrint: () => void;
  barcodeInput: string;
  setBarcodeInput: (value: string) => void;
  onBarcodeKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onScanForPart: (value: string) => void;
}

export function WarehouseBCTab({
  parts,
  totals,
  jobId,
  onAddInventoryPart,
  onAddManualPart,
  onUpdatePart,
  onDeletePart,
  onSavePart,
  onPrint,
  barcodeInput,
  setBarcodeInput,
  onBarcodeKeyPress,
  onScanForPart
}: WarehouseBCTabProps) {
  const [inventoryLookupOpen, setInventoryLookupOpen] = useState(false);
  const { calculateLineTotals } = useJobCalculations(parts);
  
  const warehouseBCParts = parts.filter(part => part.warehouse_type === 'warehouse_bc');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Factory className="w-6 h-6 text-green-600" />
              <span className="text-green-900">Warehouses B & C - Consumables</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {totals.parts_count} parts
              </Badge>
            </div>
            <Button onClick={onPrint} variant="outline" size="sm" className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print Tab
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Total Cost Price</div>
              <div className="text-2xl font-bold text-red-600">${totals.cost_total.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Total Fitting Price</div>
              <div className="text-2xl font-bold text-blue-600">${totals.fitting_total.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Tab Total</div>
              <div className="text-2xl font-bold text-green-600">${totals.line_total.toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Scanner */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Package className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <Input
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={onBarcodeKeyPress}
                placeholder="Scan or type consumable part number, batch number, or serial number..."
                className="bg-white border-green-300"
              />
            </div>
            <Button
              onClick={() => {
                onScanForPart(barcodeInput);
                setBarcodeInput('');
              }}
              disabled={!barcodeInput.trim()}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              Add Part
            </Button>
          </div>
          <div className="text-xs text-green-600 mt-2">
            Scan consumable items like oils, filters, gaskets, and other maintenance supplies
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={() => setInventoryLookupOpen(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          variant="default"
        >
          <Plus className="w-4 h-4" />
          Add from Inventory
        </Button>
        <Button 
          onClick={onAddManualPart}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Manual Entry
        </Button>
      </div>

      {/* Parts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Part No</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold text-center">Qty</TableHead>
                <TableHead className="font-semibold text-right">Cost Price</TableHead>
                <TableHead className="font-semibold text-right">Fitting Price</TableHead>
                <TableHead className="font-semibold text-right">Line Cost</TableHead>
                <TableHead className="font-semibold text-right">Line Fitting</TableHead>
                <TableHead className="font-semibold text-right">Line Total</TableHead>
                <TableHead className="font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouseBCParts.map((part) => {
                const { costTotal, fittingTotal, lineTotal } = calculateLineTotals(part);
                return (
                  <TableRow key={part.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Input
                        value={part.partno}
                        onChange={(e) => onUpdatePart(part.id!, 'partno', e.target.value)}
                        onBlur={() => onSavePart(part)}
                        className="border-0 bg-transparent p-1 text-sm"
                        placeholder="Part number"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={part.description}
                        onChange={(e) => onUpdatePart(part.id!, 'description', e.target.value)}
                        onBlur={() => onSavePart(part)}
                        className="border-0 bg-transparent p-1 text-sm"
                        placeholder="Description"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={part.quantity}
                        onChange={(e) => onUpdatePart(part.id!, 'quantity', e.target.value)}
                        onBlur={() => onSavePart(part)}
                        className="border-0 bg-transparent p-1 text-sm text-center w-20"
                        min="0"
                        step="1"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={part.cost_price}
                        onChange={(e) => onUpdatePart(part.id!, 'cost_price', e.target.value)}
                        onBlur={() => onSavePart(part)}
                        className="border-0 bg-transparent p-1 text-sm text-right w-24"
                        min="0"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={part.fitting_price}
                        onChange={(e) => onUpdatePart(part.id!, 'fitting_price', e.target.value)}
                        onBlur={() => onSavePart(part)}
                        className="border-0 bg-transparent p-1 text-sm text-right w-24"
                        min="0"
                        step="0.01"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      ${costTotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-blue-600">
                      ${fittingTotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      ${lineTotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        onClick={() => onDeletePart(part.id!)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {warehouseBCParts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No consumables added yet. Use the scanner or add parts manually.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Inventory Lookup Dialog */}
      <InventoryPartLookup
        isOpen={inventoryLookupOpen}
        onClose={() => setInventoryLookupOpen(false)}
        onSelectPart={onAddInventoryPart}
        warehouseType="warehouse_bc"
      />
    </div>
  );
}