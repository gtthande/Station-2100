import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useComplianceDocuments } from '@/hooks/useComplianceDocuments';
import { useRotableRoles } from '@/hooks/useRotableRoles';
import { FeatureGate } from '@/components/auth/FeatureGate';
import { UploadDocumentDialog } from './UploadDocumentDialog';
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  Calendar,
  AlertTriangle 
} from 'lucide-react';
import { format } from 'date-fns';

export const ComplianceTab = () => {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const { documents, isLoading, deleteDocument } = useComplianceDocuments();
  const { canLogActivities, canAccessReports } = useRotableRoles();

  const getDocumentTypeLabel = (type: string) => {
    const labels = {
      easa_certificate: 'EASA Certificate',
      faa_certificate: 'FAA Certificate',
      work_order: 'Work Order',
      repair_certificate: 'Repair Certificate',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Expired', variant: 'destructive' as const };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'warning', label: `${daysUntilExpiry} days`, variant: 'destructive' as const };
    } else if (daysUntilExpiry <= 90) {
      return { status: 'caution', label: `${daysUntilExpiry} days`, variant: 'secondary' as const };
    }
    
    return { status: 'valid', label: `${daysUntilExpiry} days`, variant: 'outline' as const };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/60">Loading compliance documents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Compliance & Documentation</h3>
        <FeatureGate requiredSystemRoles={['admin']} fallback={null}>
          {canLogActivities && (
            <Button onClick={() => setShowUploadDialog(true)} className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Document
            </Button>
          )}
        </FeatureGate>
      </div>

      <div className="grid gap-4">
        {documents.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60 mb-4">No compliance documents uploaded yet</p>
              <FeatureGate requiredSystemRoles={['admin']} fallback={null}>
                {canLogActivities && (
                  <Button onClick={() => setShowUploadDialog(true)} variant="outline" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload First Document
                  </Button>
                )}
              </FeatureGate>
            </CardContent>
          </Card>
        ) : (
          documents.map((doc) => {
            const expiryStatus = getExpiryStatus(doc.expiry_date);
            
            return (
              <Card key={doc.id} className="glass-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {doc.document_name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {expiryStatus && (
                        <Badge variant={expiryStatus.variant} className="gap-1">
                          {expiryStatus.status === 'expired' && <AlertTriangle className="w-3 h-3" />}
                          {expiryStatus.label}
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {getDocumentTypeLabel(doc.document_type)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {doc.certificate_number && (
                      <div>
                        <span className="text-white/60">Certificate No:</span>
                        <p className="text-white font-medium">{doc.certificate_number}</p>
                      </div>
                    )}
                    {doc.issuing_authority && (
                      <div>
                        <span className="text-white/60">Issuing Authority:</span>
                        <p className="text-white font-medium">{doc.issuing_authority}</p>
                      </div>
                    )}
                    {doc.issue_date && (
                      <div>
                        <span className="text-white/60">Issue Date:</span>
                        <p className="text-white font-medium">
                          {format(new Date(doc.issue_date), 'PPP')}
                        </p>
                      </div>
                    )}
                    {doc.expiry_date && (
                      <div>
                        <span className="text-white/60">Expiry Date:</span>
                        <p className="text-white font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(doc.expiry_date), 'PPP')}
                        </p>
                      </div>
                    )}
                    {doc.job_card_reference && (
                      <div>
                        <span className="text-white/60">Job Card Ref:</span>
                        <p className="text-white font-medium">{doc.job_card_reference}</p>
                      </div>
                    )}
                    {doc.work_order_reference && (
                      <div>
                        <span className="text-white/60">Work Order Ref:</span>
                        <p className="text-white font-medium">{doc.work_order_reference}</p>
                      </div>
                    )}
                  </div>
                  
                  {doc.notes && (
                    <div>
                      <span className="text-white/60 text-sm">Notes:</span>
                      <p className="text-white/80 text-sm mt-1">{doc.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="text-xs text-white/50">
                      Uploaded {format(new Date(doc.created_at), 'PPp')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                      <FeatureGate requiredSystemRoles={['admin']} fallback={null}>
                        {canLogActivities && (
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => deleteDocument(doc.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        )}
                      </FeatureGate>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <UploadDocumentDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        rotablePartId={selectedPartId}
      />
    </div>
  );
};