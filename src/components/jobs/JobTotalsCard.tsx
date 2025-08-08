import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, Package } from "lucide-react";
import { GrandTotals, TabTotals } from "@/hooks/useJobCalculations";

interface JobTotalsCardProps {
  totals: TabTotals;
  grandTotals: GrandTotals;
}

export function JobTotalsCard({ totals, grandTotals }: JobTotalsCardProps) {
  const profitMargin = grandTotals.total_fitting - grandTotals.total_cost;
  const profitPercentage = grandTotals.total_cost > 0 ? (profitMargin / grandTotals.total_cost) * 100 : 0;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Calculator className="w-5 h-5" />
          Job Totals Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tab Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-700">Warehouse A</h4>
              <Badge variant="secondary">{totals.warehouse_a.parts_count} parts</Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Cost:</span>
                <span className="font-medium">${totals.warehouse_a.cost_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fitting:</span>
                <span className="font-medium">${totals.warehouse_a.fitting_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Total:</span>
                <span className="text-blue-600">${totals.warehouse_a.line_total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-700">Warehouse B&C</h4>
              <Badge variant="secondary">{totals.warehouse_bc.parts_count} parts</Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Cost:</span>
                <span className="font-medium">${totals.warehouse_bc.cost_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fitting:</span>
                <span className="font-medium">${totals.warehouse_bc.fitting_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Total:</span>
                <span className="text-green-600">${totals.warehouse_bc.line_total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-700">Owner Supplied</h4>
              <Badge variant="secondary">{totals.owner_supplied.parts_count} parts</Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Cost:</span>
                <span className="font-medium text-gray-400">N/A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fitting:</span>
                <span className="font-medium">${totals.owner_supplied.fitting_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Total:</span>
                <span className="text-orange-600">${totals.owner_supplied.line_total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grand Totals */}
        <div className="bg-white rounded-lg p-6 border-2 border-blue-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Package className="w-4 h-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-600">Total Parts</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{grandTotals.total_parts}</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Total Cost</div>
              <div className="text-2xl font-bold text-red-600">${grandTotals.total_cost.toFixed(2)}</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Total Fitting</div>
              <div className="text-2xl font-bold text-blue-600">${grandTotals.total_fitting.toFixed(2)}</div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Grand Total</div>
              <div className="text-3xl font-bold text-green-600">${grandTotals.total_all.toFixed(2)}</div>
            </div>
          </div>

          {/* Profit Analysis */}
          {grandTotals.total_cost > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="font-semibold text-gray-700">Profit Analysis:</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">${profitMargin.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">({profitPercentage.toFixed(1)}% margin)</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}