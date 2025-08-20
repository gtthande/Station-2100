import { useState } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { UserMenu } from '@/components/navigation/UserMenu';
import { RotablePartsList } from '@/components/rotable/RotablePartsList';
import { AddRotableDialog } from '@/components/rotable/AddRotableDialog';
import { FlightTrackingList } from '@/components/rotable/FlightTrackingList';
import { RotableAlerts } from '@/components/rotable/RotableAlerts';
import { InstallationLogsTab } from '@/components/rotable/InstallationLogsTab';
import { RepairExchangeTab } from '@/components/rotable/RepairExchangeTab';
import { InventoryPoolingTab } from '@/components/rotable/InventoryPoolingTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Plus, Plane, AlertTriangle, History, Wrench, Package, FileText, Shield, BarChart3 } from 'lucide-react';
import { ComplianceTab } from '@/components/rotable/ComplianceTab';
import { ReportsTab } from '@/components/rotable/ReportsTab';
import { AuditTab } from '@/components/rotable/AuditTab';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const RotableLLP = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <div className="min-h-screen bg-surface-dark">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-white/60 hover:text-white transition-colors">
              ← Back to Dashboard
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Rotable & LLP Management</h1>
              <p className="text-white/70">Track rotable parts, LLP components, and flight time limits</p>
            </div>
          </div>
          <UserMenu />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Rotable Part
          </Button>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="parts" className="w-full">
          <TabsList className="grid w-full grid-cols-9 bg-white/5 border border-white/10">
            <TabsTrigger value="parts" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" />
              Parts Management
            </TabsTrigger>
            <TabsTrigger value="tracking" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Plane className="w-4 h-4 mr-2" />
              Flight Tracking
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Alerts & Limits
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <History className="w-4 h-4 mr-2" />
              Installation Logs
            </TabsTrigger>
            <TabsTrigger value="repair" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Wrench className="w-4 h-4 mr-2" />
              Repair & Exchange
            </TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Package className="w-4 h-4 mr-2" />
              Inventory & Pooling
            </TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              Compliance
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Shield className="w-4 h-4 mr-2" />
              Audit Trail
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parts" className="mt-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Rotable Parts Inventory</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <RotablePartsList />
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          <TabsContent value="tracking" className="mt-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Flight Time & Usage Tracking</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <FlightTrackingList />
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Alerts & Inspection Limits</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <RotableAlerts />
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Installation & Removal Logs</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <InstallationLogsTab />
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          <TabsContent value="repair" className="mt-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Repair & Exchange Records</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <RepairExchangeTab />
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          <TabsContent value="inventory" className="mt-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Inventory & Pooling Management</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <InventoryPoolingTab />
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          <TabsContent value="compliance" className="mt-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Compliance & Documentation</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <ComplianceTab />
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Reports & Analytics</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <ReportsTab />
              </GlassCardContent>
            </GlassCard>
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Audit Trail & Logs</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <AuditTab />
              </GlassCardContent>
            </GlassCard>
          </TabsContent>
        </Tabs>

        <AddRotableDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      </div>
    </div>
  );
};

export default RotableLLP;