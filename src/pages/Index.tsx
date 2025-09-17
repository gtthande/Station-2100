
import { useState } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/ui/gradient-button';
import { UserMenu } from '@/components/navigation/UserMenu';
import { HealthCheck } from '@/components/system/HealthCheck';
import { ProfileSecurityAlert } from '@/components/security/ProfileSecurityAlert';
import { useUserRoles } from '@/hooks/useUserRoles';
import { 
  Users, 
  Truck, 
  Package, 
  BarChart3, 
  CheckCircle,
  Shield,
  Send,
  Plus,
  TrendingUp,
  Building2,
  Wrench,
  FileText,
  RotateCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const { isAdmin, isSupervisor, isPartsApprover, isJobAllocator, isBatchManager } = useUserRoles();
  const [showHealthCheck, setShowHealthCheck] = useState(false);

  const canAccessApprovals = isPartsApprover() || isSupervisor() || isJobAllocator() || isAdmin();
  const canAccessAdmin = isAdmin();
  const canSubmitBatches = isBatchManager() || isSupervisor() || isAdmin();
  const canViewReports = isSupervisor() || isPartsApprover() || isAdmin();

  return (
    <div className="min-h-screen bg-surface-dark">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Station-2100</h1>
            <p className="text-white/70 text-lg">Aircraft Parts Management System - Supabase Only</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHealthCheck(!showHealthCheck)}
            >
              System Health
            </Button>
            <UserMenu />
          </div>
        </div>

        {/* Health Check Panel */}
        {showHealthCheck && (
          <div className="mb-8 flex justify-center">
            <HealthCheck />
          </div>
        )}

        {/* Security Alert */}
        <ProfileSecurityAlert />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link to="/inventory">
            <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer h-full">
              <GlassCardContent className="p-6 text-center h-full flex flex-col justify-center">
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Inventory</h3>
                <p className="text-white/60 text-sm">Manage parts and products</p>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link to="/tools">
            <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer h-full">
              <GlassCardContent className="p-6 text-center h-full flex flex-col justify-center">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Tools</h3>
                <p className="text-white/60 text-sm">Manage tools, loans, and reminders</p>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link to="/job-cards">
            <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer h-full">
              <GlassCardContent className="p-6 text-center h-full flex flex-col justify-center">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Job Cards</h3>
                <p className="text-white/60 text-sm">Manage maintenance work orders</p>
              </GlassCardContent>
            </GlassCard>
          </Link>


          {canAccessApprovals && (
            <Link to="/approvals">
              <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer h-full">
                <GlassCardContent className="p-6 text-center h-full flex flex-col justify-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Approvals</h3>
                  <p className="text-white/60 text-sm">Review and approve batches</p>
                </GlassCardContent>
              </GlassCard>
            </Link>
          )}

          {canViewReports && (
            <Link to="/reports">
              <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer h-full">
                <GlassCardContent className="p-6 text-center h-full flex flex-col justify-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Reports</h3>
                  <p className="text-white/60 text-sm">View reminders and reports</p>
                </GlassCardContent>
              </GlassCard>
            </Link>
          )}

          <Link to="/rotable-llp">
            <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer h-full">
              <GlassCardContent className="p-6 text-center h-full flex flex-col justify-center">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <RotateCcw className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Rotable & LLP</h3>
                <p className="text-white/60 text-sm">Manage rotable parts tracking</p>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link to="/customers-suppliers">
            <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer h-full">
              <GlassCardContent className="p-6 text-center h-full flex flex-col justify-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Customers & Suppliers</h3>
                <p className="text-white/60 text-sm">Manage customers and supplier relationships</p>
              </GlassCardContent>
            </GlassCard>
          </Link>

          {canAccessAdmin && (
            <Link to="/admin">
              <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer h-full">
                <GlassCardContent className="p-6 text-center h-full flex flex-col justify-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Admin</h3>
                  <p className="text-white/60 text-sm">Manage users and roles</p>
                </GlassCardContent>
              </GlassCard>
            </Link>
          )}

        </div>

        {/* Main Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

        </div>

        {/* System Status */}
        <div className="mt-12">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-3">
                <Wrench className="w-6 h-6" />
                System Status
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-white font-medium">PostgreSQL Database</p>
                  <p className="text-white/60 text-sm">Supabase Connected</p>
                </div>
                <div className="text-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-white font-medium">Authentication</p>
                  <p className="text-white/60 text-sm">Supabase Auth</p>
                </div>
                <div className="text-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-white font-medium">Storage & Realtime</p>
                  <p className="text-white/60 text-sm">Supabase Active</p>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Index;
