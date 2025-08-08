import { useState, useEffect, useCallback } from 'react';

export interface JobPart {
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

export interface TabTotals {
  warehouse_a: { cost_total: number; fitting_total: number; parts_count: number; line_total: number };
  warehouse_bc: { cost_total: number; fitting_total: number; parts_count: number; line_total: number };
  owner_supplied: { fitting_total: number; parts_count: number; line_total: number };
}

export interface GrandTotals {
  total_cost: number;
  total_fitting: number;
  total_all: number;
  total_parts: number;
}

export const useJobCalculations = (parts: JobPart[]) => {
  const [totals, setTotals] = useState<TabTotals>({
    warehouse_a: { cost_total: 0, fitting_total: 0, parts_count: 0, line_total: 0 },
    warehouse_bc: { cost_total: 0, fitting_total: 0, parts_count: 0, line_total: 0 },
    owner_supplied: { fitting_total: 0, parts_count: 0, line_total: 0 }
  });

  const [grandTotals, setGrandTotals] = useState<GrandTotals>({
    total_cost: 0,
    total_fitting: 0,
    total_all: 0,
    total_parts: 0
  });

  const calculateLineTotals = useCallback((part: JobPart) => {
    const costTotal = part.cost_price * part.quantity;
    const fittingTotal = part.fitting_price * part.quantity;
    return {
      costTotal,
      fittingTotal,
      lineTotal: costTotal + fittingTotal
    };
  }, []);

  const calculateTotals = useCallback(() => {
    const newTotals: TabTotals = {
      warehouse_a: { cost_total: 0, fitting_total: 0, parts_count: 0, line_total: 0 },
      warehouse_bc: { cost_total: 0, fitting_total: 0, parts_count: 0, line_total: 0 },
      owner_supplied: { fitting_total: 0, parts_count: 0, line_total: 0 }
    };

    parts.forEach(part => {
      const { costTotal, fittingTotal, lineTotal } = calculateLineTotals(part);

      if (part.warehouse_type === 'warehouse_a') {
        newTotals.warehouse_a.cost_total += costTotal;
        newTotals.warehouse_a.fitting_total += fittingTotal;
        newTotals.warehouse_a.line_total += lineTotal;
        newTotals.warehouse_a.parts_count += 1;
      } else if (part.warehouse_type === 'warehouse_bc') {
        newTotals.warehouse_bc.cost_total += costTotal;
        newTotals.warehouse_bc.fitting_total += fittingTotal;
        newTotals.warehouse_bc.line_total += lineTotal;
        newTotals.warehouse_bc.parts_count += 1;
      } else if (part.warehouse_type === 'owner_supplied') {
        newTotals.owner_supplied.fitting_total += fittingTotal;
        newTotals.owner_supplied.line_total += fittingTotal; // Owner supplied has no cost price
        newTotals.owner_supplied.parts_count += 1;
      }
    });

    setTotals(newTotals);

    // Calculate grand totals
    const newGrandTotals: GrandTotals = {
      total_cost: newTotals.warehouse_a.cost_total + newTotals.warehouse_bc.cost_total,
      total_fitting: newTotals.warehouse_a.fitting_total + newTotals.warehouse_bc.fitting_total + newTotals.owner_supplied.fitting_total,
      total_all: newTotals.warehouse_a.line_total + newTotals.warehouse_bc.line_total + newTotals.owner_supplied.line_total,
      total_parts: newTotals.warehouse_a.parts_count + newTotals.warehouse_bc.parts_count + newTotals.owner_supplied.parts_count
    };

    setGrandTotals(newGrandTotals);
  }, [parts, calculateLineTotals]);

  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  return {
    totals,
    grandTotals,
    calculateLineTotals,
    calculateTotals
  };
};