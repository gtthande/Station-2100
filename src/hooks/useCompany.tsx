import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Company {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  tax_id: string | null;
  zip_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyFormData {
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  tax_id: string;
  zip_code: string;
}

// Fetch company details
export const useCompany = () => {
  return useQuery({
    queryKey: ['company'],
    queryFn: async (): Promise<Company | null> => {
      const { data, error } = await supabase
        .from('company')
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - company not set up yet
          return null;
        }
        throw error;
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Update company details
export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<CompanyFormData>) => {
      const { data: result, error } = await supabase
        .from('company')
        .upsert({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast({
        title: 'Success',
        description: 'Company details updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to update company details: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Upload company logo
export const useUploadLogo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `company-logo-${Date.now()}.${fileExt}`;
      const filePath = `company-logos/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      // Update company record with logo URL
      const { data: result, error: updateError } = await supabase
        .from('company')
        .upsert({
          logo_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (updateError) throw updateError;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast({
        title: 'Success',
        description: 'Company logo uploaded successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to upload logo: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Delete company logo
export const useDeleteLogo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Get current company data
      const { data: company } = await supabase
        .from('company')
        .select('logo_url')
        .single();

      if (company?.logo_url) {
        // Extract file path from URL
        const url = new URL(company.logo_url);
        const filePath = url.pathname.split('/').slice(-2).join('/');

        // Delete from storage
        const { error: deleteError } = await supabase.storage
          .from('public')
          .remove([filePath]);

        if (deleteError) throw deleteError;
      }

      // Update company record to remove logo URL
      const { data: result, error: updateError } = await supabase
        .from('company')
        .upsert({
          logo_url: null,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (updateError) throw updateError;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast({
        title: 'Success',
        description: 'Company logo removed successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to remove logo: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};
