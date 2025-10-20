import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface EncryptedEmployeeData {
  id: string;
  employee_id: string;
  encrypted_email?: string;
  encrypted_phone?: string;
  encrypted_address?: string;
  encrypted_emergency_contact?: string;
  encrypted_ssn_last_four?: string;
  data_classification: string;
  encrypted_at: string;
  encrypted_by: string;
}

interface EncryptedCustomerData {
  id: string;
  customer_id: string;
  encrypted_email?: string;
  encrypted_phone?: string;
  encrypted_address?: string;
  encrypted_payment_info?: string;
  encrypted_notes?: string;
  data_classification: string;
  encrypted_at: string;
  encrypted_by: string;
}

export const useEncryptedData = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query encrypted employee data
  const { data: encryptedEmployeeData = [], isLoading: isLoadingEmployee } = useQuery({
    queryKey: ['encrypted-employee-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_encrypted_data')
        .select('*');
      
      if (error) {
        console.error('Error fetching encrypted employee data:', error);
        throw error;
      }
      
      return data as EncryptedEmployeeData[];
    },
    enabled: !!user,
  });

  // Query encrypted customer data
  const { data: encryptedCustomerData = [], isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['encrypted-customer-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_encrypted_data')
        .select('*');
      
      if (error) {
        console.error('Error fetching encrypted customer data:', error);
        throw error;
      }
      
      return data as EncryptedCustomerData[];
    },
    enabled: !!user,
  });

  // Mutation to store encrypted employee data
  const storeEncryptedEmployeeData = useMutation({
    mutationFn: async (data: {
      employee_id: string;
      email?: string;
      phone?: string;
      address?: string;
      emergency_contact?: string;
      ssn_last_four?: string;
    }) => {
      // Call database function to encrypt and store data
      const { data: result, error } = await supabase.rpc('encrypt_sensitive_data', {
        _data: JSON.stringify(data)
      });

      if (error) {
        console.error('Error storing encrypted employee data:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encrypted-employee-data'] });
      toast.success('Employee data encrypted and stored securely');
    },
    onError: (error) => {
      console.error('Failed to store encrypted employee data:', error);
      toast.error('Failed to encrypt employee data');
    }
  });

  // Mutation to store encrypted customer data
  const storeEncryptedCustomerData = useMutation({
    mutationFn: async (data: {
      customer_id: string;
      email?: string;
      phone?: string;
      address?: string;
      payment_info?: string;
      notes?: string;
    }) => {
      // Call database function to encrypt and store data
      const { data: result, error } = await supabase.rpc('encrypt_sensitive_data', {
        _data: JSON.stringify(data)
      });

      if (error) {
        console.error('Error storing encrypted customer data:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['encrypted-customer-data'] });
      toast.success('Customer data encrypted and stored securely');
    },
    onError: (error) => {
      console.error('Failed to store encrypted customer data:', error);
      toast.error('Failed to encrypt customer data');
    }
  });

  // Function to decrypt data (requires appropriate permissions)
  const decryptData = async (encryptedData: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('decrypt_sensitive_data', {
        _encrypted_data: encryptedData
      });

      if (error) {
        console.error('Error decrypting data:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return null;
    }
  };

  return {
    encryptedEmployeeData,
    encryptedCustomerData,
    isLoadingEmployee,
    isLoadingCustomer,
    storeEncryptedEmployeeData: storeEncryptedEmployeeData.mutate,
    storeEncryptedCustomerData: storeEncryptedCustomerData.mutate,
    decryptData,
    isStoringEmployee: storeEncryptedEmployeeData.isPending,
    isStoringCustomer: storeEncryptedCustomerData.isPending
  };
};