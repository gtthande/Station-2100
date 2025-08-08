import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Printer, Plus, Trash2, User, AlertCircle } from "lucide-react";
import { JobPart, useJobCalculations } from "@/hooks/useJobCalculations";

interface OwnerSuppliedTabProps {
  parts: JobPart[];
  totals: any;
  jobId?: number;
  onAddManualPart: () => void;
  onUpdatePart: (partId: string, field: keyof JobPart, value: string | number) => void;
  onDeletePart: (partId: string) => void;
  onSavePart: (part: JobPart) => void;
  onPrint: () => void;
}

export function OwnerSuppliedTab({
  parts,
  totals,
  jobId,
  onAddManualPart,
  onUpdatePart,
  onDeletePart,
  onSavePart,
  onPrint
}: OwnerSuppliedTabProps) {
  const { calculateLineTotals } = useJobCalculations(parts);
  
  const ownerSuppliedParts = parts.filter(part => part.warehouse_type === 'owner_supplied');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-6 h-6 text-orange-600" />
              <span className="text-orange-900">Owner-Supplied Items</span>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Total Fitting Price</div>
              <div className="text-2xl font-bold text-orange-600">${totals.fitting_total.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Tab Total</div>
              <div className="text-2xl font-bold text-orange-600">${totals.line_total.toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Notice */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Owner-Supplied Items Information</p>
              <ul className="space-y-1 text-xs">
                <li>• These items do not affect stock levels or inventory</li>
                <li>• Cost prices can be $0.00 as these are customer-provided parts</li>
                <li>• You can type any item description - not limited to inventory</li>
                <li>• Fitting prices reflect the labor/installation charges</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex gap-2">
        <Button 
          onClick={onAddManualPart}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
          variant="default"
        >
          <Plus className="w-4 h-4" />
          Add Owner-Supplied Item
        </Button>
      </div>

      {/* Parts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Item Description</TableHead>
                <TableHead className="font-semibold">Part/Model No</TableHead>
                <TableHead className="font-semibold text-center">Qty</TableHead>
                <TableHead className="font-semibold text-right">Item Value</TableHead>
                <TableHead className="font-semibold text-right">Fitting Price</TableHead>
                <TableHead className="font-semibold text-right">Line Fitting</TableHead>
                <TableHead className="font-semibold text-right">Line Total</TableHead>
                <TableHead className="font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ownerSuppliedParts.map((part) => {
                const { fittingTotal, lineTotal } = calculateLineTotals(part);
                return (
                  <TableRow key={part.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Input
                        value={part.description}
                        onChange={(e) => onUpdatePart(part.id!, 'description', e.target.value)}
                        onBlur={() => onSavePart(part)}
                        className="border-0 bg-transparent p-1 text-sm"
                        placeholder="Item description (e.g., Customer-supplied engine oil)"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={part.partno}
                        onChange={(e) => onUpdatePart(part.id!, 'partno', e.target.value)}
                        onBlur={() => onSavePart(part)}
                        className="border-0 bg-transparent p-1 text-sm"
                        placeholder="Part/Model number"
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
                        placeholder="0.00"
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
                    <TableCell className="text-right font-medium text-orange-600">
                      ${fittingTotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-orange-600">
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
              {ownerSuppliedParts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No owner-supplied items added yet. Add items that the customer is providing for this job.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}