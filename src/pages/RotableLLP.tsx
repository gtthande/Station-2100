import { useState } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { UserMenu } from '@/components/navigation/UserMenu';
import { RotablePartsList } from '@/components/rotable/RotablePartsList';
import { AddRotableDialog } from '@/components/rotable/AddRotableDialog';
import { FlightTrackingList } from '@/components/rotable/FlightTrackingList';
import { RotableAlerts } from '@/components/rotable/RotableAlerts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Plus, Plane, AlertTriangle } from 'lucide-react';
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
          <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
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
        </Tabs>

        <AddRotableDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      </div>
    </div>
  );
};

export default RotableLLP;