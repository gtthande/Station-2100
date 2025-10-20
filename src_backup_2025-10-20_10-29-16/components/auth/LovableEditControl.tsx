import { useEffect } from 'react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAuth } from '@/hooks/useAuth';

export const LovableEditControl = () => {
  const { user } = useAuth();
  const { canManageSystem } = useUserRoles();

  useEffect(() => {
    // Only show Lovable edit interface for system managers (admins/system owners)
    const hasEditAccess = user && canManageSystem();
    
    // Hide/show Lovable edit interface based on permissions
    const style = document.createElement('style');
    style.id = 'lovable-edit-control';
    
    if (!hasEditAccess) {
      style.textContent = `
        [data-lovable-edit],
        [data-lovable-edit-panel],
        .lovable-edit-button,
        .lovable-edit-overlay,
        iframe[src*="lovable.dev"],
        div[id*="lovable"],
        div[class*="lovable"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `;
    } else {
      style.textContent = '';
    }
    
    // Remove existing style if present
    const existingStyle = document.getElementById('lovable-edit-control');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Add new style
    document.head.appendChild(style);
    
    return () => {
      const styleToRemove = document.getElementById('lovable-edit-control');
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, [user, canManageSystem]);

  return null;
};