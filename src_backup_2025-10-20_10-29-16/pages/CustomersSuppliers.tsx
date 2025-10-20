import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { UserMenu } from '@/components/navigation/UserMenu';
import { Users, Truck, Plus, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const CustomersSuppliers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-white/70 hover:text-white transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Customers & Suppliers</h1>
                <p className="text-white/70">Manage customer information and supplier relationships</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Main Content */}
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Main Workflow Roles</h2>
            <p className="text-white/70">Select your area of responsibility</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Customers Card */}
            <Link to="/customers">
              <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer h-full">
                <GlassCardContent className="p-8 text-center h-full flex flex-col justify-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">Customer Management</h3>
                  <p className="text-white/70 mb-6">Manage customer information, aircraft details, and service records</p>
                  <div className="mt-auto">
                    <GradientButton className="gap-2 w-full">
                      <Users className="w-4 h-4" />
                      Access Customers
                    </GradientButton>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </Link>

            {/* Suppliers Card */}
            <Link to="/suppliers">
              <GlassCard className="hover:bg-white/5 transition-all duration-300 cursor-pointer h-full">
                <GlassCardContent className="p-8 text-center h-full flex flex-col justify-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <Truck className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">Supplier Management</h3>
                  <p className="text-white/70 mb-6">Track supplier relationships, parts sourcing, and delivery schedules</p>
                  <div className="mt-auto">
                    <GradientButton className="gap-2 w-full">
                      <Truck className="w-4 h-4" />
                      Access Suppliers
                    </GradientButton>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomersSuppliers;
