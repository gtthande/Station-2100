
import { useState } from 'react';
import { UserRoleManagement } from '@/components/admin/UserRoleManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { CustomRoleManagement } from '@/components/admin/CustomRoleManagement';
import { UserRoleAssignment } from '@/components/admin/UserRoleAssignment';
import { ExcelImport } from '@/components/admin/ExcelImport';
import { DepartmentManagement } from '@/components/admin/DepartmentManagement';
import { StockCategoryManagement } from '@/components/admin/StockCategoryManagement';
import { HRManagement } from '@/components/admin/HRManagement';
import { SecurityAuditLog } from '@/components/admin/SecurityAuditLog';
import { SampleUsersManagement } from '@/components/admin/SampleUsersManagement';
import { CustomerPermissionManagement } from '@/components/admin/CustomerPermissionManagement';
import { UserMenu } from '@/components/navigation/UserMenu';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Link } from 'react-router-dom';
import { Shield, Users, Settings, UserCheck, Cog, Upload, Building2, Package, Lock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Admin = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'custom-roles' | 'advanced-assignment' | 'import' | 'departments' | 'stock-categories' | 'sample-users' | 'hr-management' | 'security-audit'>('users');
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
      {/* Security Alert */}
      <div className="max-w-7xl mx-auto px-6 pt-4">
        <Alert className="mb-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            🔒 <strong>Security Enhanced:</strong> Employee profile access has been secured. Only users can view their own profiles, and admins/HR personnel can access employee data for legitimate purposes.
          </AlertDescription>
        </Alert>
      </div>

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
                <p className="text-white/60">Manage users, roles, security and system permissions</p>
              </div>
            </div>
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-2 mb-6 flex-wrap">
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
          <Button
            variant={activeTab === 'custom-roles' ? 'default' : 'outline'}
            onClick={() => setActiveTab('custom-roles')}
            className={
              activeTab === 'custom-roles'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                : 'border-white/20 text-white hover:bg-white/10'
            }
          >
            <Cog className="w-4 h-4 mr-2" />
            Custom Roles
          </Button>
          <Button
            variant={activeTab === 'advanced-assignment' ? 'default' : 'outline'}
            onClick={() => setActiveTab('advanced-assignment')}
            className={
              activeTab === 'advanced-assignment'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                : 'border-white/20 text-white hover:bg-white/10'
            }
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Advanced Assignment
          </Button>
          <Button
            variant={activeTab === 'import' ? 'default' : 'outline'}
            onClick={() => setActiveTab('import')}
            className={
              activeTab === 'import'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                : 'border-white/20 text-white hover:bg-white/10'
            }
          >
            <Upload className="w-4 h-4 mr-2" />
            Excel Import
          </Button>
          <Button
            variant={activeTab === 'departments' ? 'default' : 'outline'}
            onClick={() => setActiveTab('departments')}
            className={
              activeTab === 'departments'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                : 'border-white/20 text-white hover:bg-white/10'
            }
          >
            <Building2 className="w-4 h-4 mr-2" />
            Departments
          </Button>
          <Button
            variant={activeTab === 'stock-categories' ? 'default' : 'outline'}
            onClick={() => setActiveTab('stock-categories')}
            className={
              activeTab === 'stock-categories'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                : 'border-white/20 text-white hover:bg-white/10'
            }
          >
            <Package className="w-4 h-4 mr-2" />
            Stock Categories
          </Button>
          <Button
            variant={activeTab === 'sample-users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('sample-users')}
            className={
              activeTab === 'sample-users'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                : 'border-white/20 text-white hover:bg-white/10'
            }
          >
            <Users className="w-4 h-4 mr-2" />
            Sample Users
          </Button>
          <Button
            variant={activeTab === 'hr-management' ? 'default' : 'outline'}
            onClick={() => setActiveTab('hr-management')}
            className={
              activeTab === 'hr-management'
                ? 'bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700'
                : 'border-white/20 text-white hover:bg-white/10'
            }
          >
            <Lock className="w-4 h-4 mr-2" />
            HR Security
          </Button>
          <Button
            variant={activeTab === 'security-audit' ? 'default' : 'outline'}
            onClick={() => setActiveTab('security-audit')}
            className={
              activeTab === 'security-audit'
                ? 'bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700'
                : 'border-white/20 text-white hover:bg-white/10'
            }
          >
            <Eye className="w-4 h-4 mr-2" />
            Security Audit
          </Button>
        </div>

        {activeTab === 'users' && (
          <div className="space-y-6">
            <UserManagement />
            <CustomerPermissionManagement />
          </div>
        )}
        {activeTab === 'roles' && <UserRoleManagement />}
        {activeTab === 'custom-roles' && <CustomRoleManagement />}
        {activeTab === 'advanced-assignment' && <UserRoleAssignment />}
        {activeTab === 'import' && <ExcelImport />}
        {activeTab === 'departments' && <DepartmentManagement />}
        {activeTab === 'stock-categories' && <StockCategoryManagement />}
        {activeTab === 'sample-users' && <SampleUsersManagement />}
        {activeTab === 'hr-management' && <HRManagement />}
        {activeTab === 'security-audit' && <SecurityAuditLog />}
      </div>
    </div>
  );
};

export default Admin;
