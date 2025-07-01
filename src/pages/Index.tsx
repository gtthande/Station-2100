import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Activity } from "lucide-react";
import { Package, Shield, Truck, Users, CheckCircle } from 'lucide-react';
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Header */}
      <div className="border-b border-white/10 bg-surface-dark/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-white">
            Station-2100 Dashboard
          </h1>
          <p className="text-white/60">
            Welcome to your aircraft maintenance management platform
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Link to="/customers">
              <GlassCard className="hover:scale-105 transition-transform cursor-pointer">
                <GlassCardContent className="p-6 text-center">
                  <div className="w-16 h-16 gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Customer Management</h3>
                  <p className="text-white/70">Manage aircraft owners and maintenance records</p>
                </GlassCardContent>
              </GlassCard>
            </Link>

            <Link to="/suppliers">
              <GlassCard className="hover:scale-105 transition-transform cursor-pointer">
                <GlassCardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Truck className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Supplier Network</h3>
                  <p className="text-white/70">Connect with parts suppliers and vendors</p>
                </GlassCardContent>
              </GlassCard>
            </Link>

            <Link to="/inventory">
              <GlassCard className="hover:scale-105 transition-transform cursor-pointer">
                <GlassCardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Inventory Control</h3>
                  <p className="text-white/70">Track parts, batches, and stock levels</p>
                </GlassCardContent>
              </GlassCard>
            </Link>

            <Link to="/approvals">
              <GlassCard className="hover:scale-105 transition-transform cursor-pointer">
                <GlassCardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Parts Approval</h3>
                  <p className="text-white/70">Review incoming parts and job allocation</p>
                </GlassCardContent>
              </GlassCard>
            </Link>

            <Link to="/admin">
              <GlassCard className="hover:scale-105 transition-transform cursor-pointer">
                <GlassCardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Administration</h3>
                  <p className="text-white/70">Manage user roles and system settings</p>
                </GlassCardContent>
              </GlassCard>
            </Link>

            <GlassCard className="hover:scale-105 transition-transform cursor-pointer opacity-60">
              <GlassCardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Analytics Dashboard</h3>
                <p className="text-white/70">Coming Soon - Performance metrics and insights</p>
              </GlassCardContent>
            </GlassCard>
          </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard>
            <GlassCardContent className="p-6 text-center">
              <h3 className="text-2xl font-bold text-white mb-1">0</h3>
              <p className="text-white/70">Aircraft in Maintenance</p>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardContent className="p-6 text-center">
              <h3 className="text-2xl font-bold text-white mb-1">0</h3>
              <p className="text-white/70">Parts on Order</p>
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardContent className="p-6 text-center">
              <h3 className="text-2xl font-bold text-white mb-1">0</h3>
              <p className="text-white/70">Technicians Available</p>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Index;
