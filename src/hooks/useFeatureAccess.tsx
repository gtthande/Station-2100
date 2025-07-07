
import { useUserRoles } from '@/hooks/useUserRoles';

export const useFeatureAccess = () => {
  const { 
    canManageSystem, 
    canViewReports, 
    canManageCustomers, 
    canManageSuppliers, 
    canViewAnalytics,
    hasCustomRole,
    hasRole,
    hasAnyRole
  } = useUserRoles();

  // Define feature access rules
  const features = {
    // Admin features
    userManagement: canManageSystem,
    roleManagement: canManageSystem,
    systemSettings: canManageSystem,
    
    // Business features
    reports: canViewReports,
    customers: canManageCustomers,
    suppliers: canManageSuppliers,
    analytics: canViewAnalytics,
    
    // Inventory features
    inventory: hasAnyRole(['admin', 'system_owner', 'supervisor', 'parts_approver', 'job_allocator', 'batch_manager']),
    batchApproval: hasAnyRole(['admin', 'system_owner', 'supervisor', 'parts_approver']),
    jobAllocation: hasAnyRole(['admin', 'system_owner', 'supervisor', 'job_allocator']),
    batchManagement: hasAnyRole(['admin', 'system_owner', 'supervisor', 'batch_manager']),
  };

  // Generic feature checker
  const hasFeatureAccess = (featureName: keyof typeof features): boolean => {
    return features[featureName]();
  };

  // Check multiple features
  const hasAnyFeatureAccess = (featureNames: Array<keyof typeof features>): boolean => {
    return featureNames.some(feature => features[feature]());
  };

  const hasAllFeatureAccess = (featureNames: Array<keyof typeof features>): boolean => {
    return featureNames.every(feature => features[feature]());
  };

  return {
    features,
    hasFeatureAccess,
    hasAnyFeatureAccess,
    hasAllFeatureAccess,
    // Direct access to role checking functions
    hasCustomRole,
    hasRole,
    hasAnyRole,
  };
};
