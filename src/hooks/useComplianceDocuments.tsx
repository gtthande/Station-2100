import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ComplianceDocument {
  id: string;
  user_id: string;
  rotable_part_id: string;
  document_type: 'easa_certificate' | 'faa_certificate' | 'work_order' | 'repair_certificate';
  document_name: string;
  document_url: string;
  certificate_number?: string;
  issue_date?: string;
  expiry_date?: string;
  issuing_authority?: string;
  job_card_reference?: string;
  work_order_reference?: string;
  notes?: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export const useComplianceDocuments = (rotablePartId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ['compliance-documents', user?.id, rotablePartId],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      let query = supabase
        .from('compliance_documents')
        .select('*')
        .eq('user_id', user.id);
      
      if (rotablePartId) {
        query = query.eq('rotable_part_id', rotablePartId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ComplianceDocument[];
    },
    enabled: !!user?.id,
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (documentData: Omit<ComplianceDocument, 'id' | 'user_id' | 'uploaded_by' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('compliance_documents')
        .insert({
          ...documentData,
          user_id: user.id,
          uploaded_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-documents'] });
      toast.success('Document uploaded successfully');
    },
    onError: (error) => {
      toast.error(`Failed to upload document: ${error.message}`);
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async ({ id, ...documentData }: Partial<ComplianceDocument> & { id: string }) => {
      const { data, error } = await supabase
        .from('compliance_documents')
        .update(documentData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-documents'] });
      toast.success('Document updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update document: ${error.message}`);
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('compliance_documents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-documents'] });
      toast.success('Document deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });

  return {
    documents,
    isLoading,
    error,
    uploadDocument: uploadDocumentMutation.mutate,
    updateDocument: updateDocumentMutation.mutate,
    deleteDocument: deleteDocumentMutation.mutate,
    isUploading: uploadDocumentMutation.isPending,
    isUpdating: updateDocumentMutation.isPending,
    isDeleting: deleteDocumentMutation.isPending,
  };
};