
import { useUserRoles } from '@/hooks/useUserRoles';
import { ReactNode } from 'react';

interface FeatureGateProps {
  children: ReactNode;
  requiredRoles?: string[];
  requiredSystemRoles?: Array<'admin' | 'system_owner' | 'supervisor' | 'parts_approver' | 'job_allocator' | 'batch_manager'>;
  fallback?: ReactNode;
  requireAll?: boolean; // If true, user must have ALL roles, if false, user needs ANY role
}

export const FeatureGate = ({ 
  children, 
  requiredRoles = [], 
  requiredSystemRoles = [],
  fallback = null,
  requireAll = false 
}: FeatureGateProps) => {
  const { hasCustomRole, hasRole } = useUserRoles();
  
  const allRequiredRoles = [
    ...requiredRoles,
    ...requiredSystemRoles
  ];

  if (allRequiredRoles.length === 0) {
    return <>{children}</>;
  }

  const hasAccess = requireAll 
    ? allRequiredRoles.every(role => 
        requiredSystemRoles.includes(role as any) 
          ? hasRole(role as any) 
          : hasCustomRole(role)
      )
    : allRequiredRoles.some(role => 
        requiredSystemRoles.includes(role as any) 
          ? hasRole(role as any) 
          : hasCustomRole(role)
      );

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
