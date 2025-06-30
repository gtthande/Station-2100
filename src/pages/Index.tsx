
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { UserMenu } from '@/components/navigation/UserMenu';
import { Users, Building, Package, ClipboardList, BarChart3, Settings, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const features = [
    {
      icon: Users,
      title: 'Customer Management',
      description: 'Manage your customer database with aircraft details and contact information',
      link: '/customers',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Building,
      title: 'Supplier Management',
      description: 'Track your parts suppliers and vendor relationships',
      link: '/suppliers',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Track parts, stock levels, and locations across your facility',
      link: '#',
      color: 'from-purple-500 to-indigo-500'
    },
    {
      icon: ClipboardList,
      title: 'Job Cards & Work Orders',
      description: 'Create and manage maintenance tasks and work orders',
      link: '#',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: BarChart3,
      title: 'Reports & Analytics',
      description: 'Generate insights and reports on your maintenance operations',
      link: '#',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: Settings,
      title: 'System Settings',
      description: 'Configure users, permissions, and system preferences',
      link: '#',
      color: 'from-gray-500 to-slate-500'
    }
  ];

  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Header */}
      <div className="border-b border-white/10 bg-surface-dark/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Station-2100</h1>
              <p className="text-white/60">Aviation Maintenance Management System</p>
            </div>
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Welcome to Station-2100
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
            Your comprehensive aviation maintenance management system. 
            Streamline operations, track inventory, and manage customer relationships all in one place.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <GlassCard>
            <GlassCardContent className="p-6 text-center">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">0</h3>
              <p className="text-white/70">Active Customers</p>
            </GlassCardContent>
          </GlassCard>
          
          <GlassCard>
            <GlassCardContent className="p-6 text-center">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mx-auto mb-3">
                <Building className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">0</h3>
              <p className="text-white/70">Suppliers</p>
            </GlassCardContent>
          </GlassCard>
          
          <GlassCard>
            <GlassCardContent className="p-6 text-center">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">0</h3>
              <p className="text-white/70">Parts in Stock</p>
            </GlassCardContent>
          </GlassCard>
          
          <GlassCard>
            <GlassCardContent className="p-6 text-center">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mx-auto mb-3">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">0</h3>
              <p className="text-white/70">Active Jobs</p>
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            const isClickable = feature.link !== '#';
            
            const CardContent = (
              <GlassCard className={`h-full ${isClickable ? 'hover:bg-white/5 transition-all duration-300 cursor-pointer' : 'opacity-60'}`}>
                <GlassCardHeader className="pb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <GlassCardTitle className="text-xl mb-2">{feature.title}</GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent className="pt-0">
                  <p className="text-white/70 mb-4">{feature.description}</p>
                  <div className="flex items-center justify-between">
                    <GradientButton 
                      variant={isClickable ? "gradient" : "outline"}
                      size="sm"
                      className="gap-2"
                      disabled={!isClickable}
                    >
                      {isClickable ? 'Open' : 'Coming Soon'}
                      {isClickable && <ArrowRight className="w-4 h-4" />}
                    </GradientButton>
                    {!isClickable && (
                      <span className="text-xs text-white/50">Under Development</span>
                    )}
                  </div>
                </GlassCardContent>
              </GlassCard>
            );

            return isClickable ? (
              <Link key={index} to={feature.link} className="block h-full">
                {CardContent}
              </Link>
            ) : (
              <div key={index} className="h-full">
                {CardContent}
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <GlassCard className="p-8">
            <GlassCardContent>
              <h3 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h3>
              <p className="text-white/70 mb-6 max-w-2xl mx-auto">
                Begin by adding your customers and suppliers to build your comprehensive aviation maintenance database.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/customers">
                  <GradientButton size="lg" className="gap-2">
                    <Users className="w-5 h-5" />
                    Add Customers
                  </GradientButton>
                </Link>
                <Link to="/suppliers">
                  <GradientButton size="lg" variant="outline" className="gap-2">
                    <Building className="w-5 h-5" />
                    Add Suppliers
                  </GradientButton>
                </Link>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Index;
