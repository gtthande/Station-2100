import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PasswordCheckResponse {
  isCompromised: boolean;
  occurrences?: number;
  recommendation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const usePasswordSecurity = () => {
  const checkPasswordSecurity = useMutation({
    mutationFn: async (password: string): Promise<PasswordCheckResponse> => {
      const { data, error } = await supabase.functions.invoke('check-leaked-password', {
        body: { password }
      });

      if (error) {
        console.error('Password security check error:', error);
        throw error;
      }

      return data;
    },
    onError: (error) => {
      console.error('Password security check failed:', error);
      toast.error('Unable to verify password security');
    }
  });

  const checkPasswordWithWarning = async (password: string): Promise<boolean> => {
    try {
      const result = await checkPasswordSecurity.mutateAsync(password);
      
      if (result.isCompromised) {
        const occurrences = result.occurrences || 0;
        let toastFn = toast.warning;
        
        if (result.severity === 'critical') {
          toastFn = toast.error;
        } else if (result.severity === 'high') {
          toastFn = toast.error;
        }
        
        toastFn(
          `Security Warning: ${result.recommendation} (Found ${occurrences.toLocaleString()} times in breaches)`,
          {
            duration: 8000,
            description: 'We strongly recommend choosing a different password for your security.'
          }
        );
        
        return false; // Password is compromised
      }
      
      toast.success('Password security verified ✓', {
        description: 'This password has not been found in known data breaches.'
      });
      
      return true; // Password is safe
    } catch (error) {
      // If the check fails, we don't block the user but warn them
      toast.warning('Unable to verify password security', {
        description: 'Please ensure you are using a strong, unique password.'
      });
      return true; // Allow password if check fails
    }
  };

  return {
    checkPasswordSecurity: checkPasswordSecurity.mutate,
    checkPasswordWithWarning,
    isLoading: checkPasswordSecurity.isPending,
    error: checkPasswordSecurity.error
  };
};