
import { useState } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { UserMenu } from '@/components/navigation/UserMenu';
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
            <p className="text-white/70 text-lg">Aircraft Parts Management System</p>
          </div>
          <UserMenu />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link to="/inventory">
            <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer">
              <GlassCardContent className="p-6 text-center">
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Inventory</h3>
                <p className="text-white/60 text-sm">Manage parts and products</p>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link to="/tools">
            <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer">
              <GlassCardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Tools</h3>
                <p className="text-white/60 text-sm">Manage tools, loans, and reminders</p>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link to="/job-cards">
            <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer">
              <GlassCardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Job Cards</h3>
                <p className="text-white/60 text-sm">Manage maintenance work orders</p>
              </GlassCardContent>
            </GlassCard>
          </Link>

          {canSubmitBatches && (
            <Link to="/batch-submission">
              <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer">
                <GlassCardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Submit Batch</h3>
                  <p className="text-white/60 text-sm">Submit new batches for approval</p>
                </GlassCardContent>
              </GlassCard>
            </Link>
          )}

          {canAccessApprovals && (
            <Link to="/approvals">
              <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer">
                <GlassCardContent className="p-6 text-center">
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
              <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer">
                <GlassCardContent className="p-6 text-center">
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
            <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer">
              <GlassCardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <RotateCcw className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Rotable & LLP</h3>
                <p className="text-white/60 text-sm">Manage rotable parts tracking</p>
              </GlassCardContent>
            </GlassCard>
          </Link>

          {canAccessAdmin && (
            <Link to="/admin">
              <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer">
                <GlassCardContent className="p-6 text-center">
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
          <Link to="/job-cards">
            <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer">
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-3">
                  <Wrench className="w-6 h-6" />
                  Job Cards
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-white/70 mb-4">
                  Manage aircraft maintenance job cards and work orders.
                </p>
                <div className="flex items-center text-blue-400 font-medium">
                  View Job Cards
                  <FileText className="w-4 h-4 ml-2" />
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>
          <Link to="/customers">
            <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer">
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-3">
                  <Users className="w-6 h-6" />
                  Customers
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-white/70 mb-4">
                  Manage customer information, aircraft details, and service records.
                </p>
                <div className="flex items-center text-blue-400 font-medium">
                  View Customers
                  <TrendingUp className="w-4 h-4 ml-2" />
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link to="/suppliers">
            <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer">
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-3">
                  <Truck className="w-6 h-6" />
                  Suppliers
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-white/70 mb-4">
                  Track supplier relationships, parts sourcing, and delivery schedules.
                </p>
                <div className="flex items-center text-blue-400 font-medium">
                  View Suppliers
                  <Building2 className="w-4 h-4 ml-2" />
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link to="/inventory">
            <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer">
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-3">
                  <Package className="w-6 h-6" />
                  Inventory
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-white/70 mb-4">
                  Monitor stock levels, track parts movement, and manage inventory batches.
                </p>
                <div className="flex items-center text-blue-400 font-medium">
                  View Inventory
                  <BarChart3 className="w-4 h-4 ml-2" />
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>

          <Link to="/stock-movements">
            <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer">
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6" />
                  Stock Movement & Valuation
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-white/70 mb-4">
                  Track stock movements, calculate valuations, and generate comprehensive reports.
                </p>
                <div className="flex items-center text-blue-400 font-medium">
                  View Stock Reports
                  <BarChart3 className="w-4 h-4 ml-2" />
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>
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
                  <p className="text-white font-medium">Inventory System</p>
                  <p className="text-white/60 text-sm">Operational</p>
                </div>
                <div className="text-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-white font-medium">Database</p>
                  <p className="text-white/60 text-sm">Connected</p>
                </div>
                <div className="text-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-white font-medium">Security</p>
                  <p className="text-white/60 text-sm">Active</p>
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
