
import { useUserRoles } from '@/hooks/useUserRoles';

export const useFeatureAccess = () => {
  const userRoles = useUserRoles();
  
  // Helper function to safely call role checking functions
  const checkRole = (roleChecker: (() => boolean) | boolean) => {
    if (typeof roleChecker === 'function') {
      return roleChecker();
    }
    return roleChecker;
  };

  const hasAccess = (requiredRoles: string[], requireAll = false) => {
    if (requiredRoles.length === 0) return true;
    
    const accessChecks = requiredRoles.map(role => {
      // Check system roles first
      switch (role) {
        case 'admin':
          return checkRole(userRoles.isAdmin);
        case 'system_owner':
          return checkRole(userRoles.isSystemOwner);
        case 'supervisor':
          return checkRole(userRoles.isSupervisor);
        case 'parts_approver':
          return checkRole(userRoles.isPartsApprover);
        case 'job_allocator':
          return checkRole(userRoles.isJobAllocator);
        case 'batch_manager':
          return checkRole(userRoles.isBatchManager);
        default:
          // Check custom roles
          return userRoles.hasCustomRole(role);
      }
    });

    return requireAll 
      ? accessChecks.every(check => check)
      : accessChecks.some(check => check);
  };

  return {
    hasAccess,
    ...userRoles
  };
};
