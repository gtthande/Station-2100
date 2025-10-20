
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BackButton } from '@/components/navigation/BackButton';
import { UserMenu } from '@/components/navigation/UserMenu';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToolSubmissionForm } from '@/components/tools/ToolSubmissionForm';
import { ToolTransactionForm } from '@/components/tools/ToolTransactionForm';
import { ToolsList } from '@/components/tools/ToolsList';
import { ToolMovementReport } from '@/components/tools/ToolMovementReport';
import UnreturnedToolsReport from '@/components/tools/UnreturnedToolsReport';
import ToolEventsReport from '@/components/tools/ToolEventsReport';

const Tools = () => {
  const [activeTab, setActiveTab] = useState('entry');

  // Basic SEO without extra deps
  useEffect(() => {
    document.title = 'Tools Management | Station-2100';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Manage tools, view unreturned items and tool activity reports in Station-2100.');
    else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Manage tools, view unreturned items and tool activity reports in Station-2100.';
      document.head.appendChild(m);
    }
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + '/tools';
  }, []);

  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Header */}
      <div className="border-b border-white/10 bg-surface-dark/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackButton />
              <Link to="/" className="text-white/60 hover:text-white transition-colors">
                ← Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Tools Management</h1>
                <p className="text-white/60">Track tools, outstanding returns, and activity</p>
              </div>
            </div>
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white/5 backdrop-blur">
            <TabsTrigger value="entry" className="data-[state=active]:bg-white/10">
              Tool Entry
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-white/10">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-white/10">
              Inventory
            </TabsTrigger>
            <TabsTrigger value="movements" className="data-[state=active]:bg-white/10">
              Movements
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-white/10">
              Reports
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-white/10">
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entry" className="space-y-6">
            <ToolSubmissionForm />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <ToolTransactionForm />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <ToolsList />
          </TabsContent>

          <TabsContent value="movements" className="space-y-6">
            <ToolMovementReport />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <section aria-labelledby="tools-overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard>
                  <GlassCardHeader>
                    <GlassCardTitle id="tools-overview">Unreturned Tools</GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <UnreturnedToolsReport />
                  </GlassCardContent>
                </GlassCard>

                <GlassCard>
                  <GlassCardHeader>
                    <GlassCardTitle>More Reports</GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <p className="text-white/70 mb-4">See full tools reports and reminders in the Reports section.</p>
                    <Link to="/reports" className="text-primary hover:underline">Go to Reports →</Link>
                  </GlassCardContent>
                </GlassCard>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Tool Activity</GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <ToolEventsReport />
              </GlassCardContent>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Tools;
