
import { useState } from 'react';
import { UserRoleManagement } from '@/components/admin/UserRoleManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { UserMenu } from '@/components/navigation/UserMenu';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Link } from 'react-router-dom';
import { Shield, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';

const Admin = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const { canManageSystem, isLoading } = useUserRoles();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!canManageSystem()) {
    return (
      <div className="min-h-screen bg-surface-dark flex items-center justify-center">
        <GlassCard>
          <GlassCardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
            <p className="text-white/60">You need administrator or system owner privileges to access this page.</p>
            <Link to="/" className="mt-4 inline-block text-blue-400 hover:text-blue-300">
              ← Return to Dashboard
            </Link>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Header */}
      <div className="border-b border-white/10 bg-surface-dark/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-white/60 hover:text-white transition-colors">
                ← Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  System Administration
                </h1>
                <p className="text-white/60">Manage users, roles and system permissions</p>
              </div>
            </div>
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
            className={
              activeTab === 'users'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                : 'border-white/20 text-white hover:bg-white/10'
            }
          >
            <Users className="w-4 h-4 mr-2" />
            User Management
          </Button>
          <Button
            variant={activeTab === 'roles' ? 'default' : 'outline'}
            onClick={() => setActiveTab('roles')}
            className={
              activeTab === 'roles'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                : 'border-white/20 text-white hover:bg-white/10'
            }
          >
            <Settings className="w-4 h-4 mr-2" />
            Role Management
          </Button>
        </div>

        {activeTab === 'users' ? <UserManagement /> : <UserRoleManagement />}
      </div>
    </div>
  );
};

export default Admin;
