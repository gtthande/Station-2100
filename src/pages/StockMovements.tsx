import { useState } from 'react';
import { UserMenu } from '@/components/navigation/UserMenu';
import { Link } from 'react-router-dom';
import { BarChart3, Plus, Settings, TrendingUp, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OpeningBalanceDialog } from '@/components/stock/OpeningBalanceDialog';
import { StockAdjustmentDialog } from '@/components/stock/StockAdjustmentDialog';
import { StockMovementReport } from '@/components/stock/StockMovementReport';
import { StockValuationReport } from '@/components/stock/StockValuationReport';
import { BatchBreakdownReport } from '@/components/stock/BatchBreakdownReport';

const StockMovements = () => {
  const [openingBalanceOpen, setOpeningBalanceOpen] = useState(false);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);

  return (
    <div className="min-h-screen bg-app-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                ← Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-6 h-6" />
                  Stock Movement & Valuation
                </h1>
                <p className="text-muted-foreground">Track inventory movements and calculate stock valuations</p>
              </div>
            </div>
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-6">
          <Button onClick={() => setOpeningBalanceOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Opening Balance
          </Button>
          <Button variant="outline" onClick={() => setAdjustmentOpen(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Stock Adjustment
          </Button>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="movements" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="movements" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Movements
            </TabsTrigger>
            <TabsTrigger value="valuation" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Valuation
            </TabsTrigger>
            <TabsTrigger value="batches" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Batch Breakdown
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="movements" className="space-y-6">
            <StockMovementsList />
          </TabsContent>

          <TabsContent value="valuation" className="space-y-6">
            <StockValuationReport />
          </TabsContent>

          <TabsContent value="batches" className="space-y-6">
            <BatchBreakdownReport />
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            <div className="grid gap-6">
              <div className="bg-muted/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Stock Movement System</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Event Types:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Opening Balance - Initial stock quantities</li>
                      <li>• Batch Receipt - Stock received from suppliers</li>
                      <li>• Job Card Issue - Stock issued to job cards</li>
                      <li>• Adjustment In - Stock increases</li>
                      <li>• Adjustment Out - Stock decreases</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Features:</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Immutable, append-only movements</li>
                      <li>• Weighted average cost calculation</li>
                      <li>• As-of-date stock queries</li>
                      <li>• Batch-level tracking</li>
                      <li>• Source reference deduplication</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <OpeningBalanceDialog 
          open={openingBalanceOpen} 
          onOpenChange={setOpeningBalanceOpen} 
        />
        <StockAdjustmentDialog 
          open={adjustmentOpen} 
          onOpenChange={setAdjustmentOpen} 
        />
      </div>
    </div>
  );
};

export default StockMovements;