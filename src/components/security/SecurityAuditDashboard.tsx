import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Clock, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SecurityAuditEvent {
  id: string;
  event_type: string;
  table_name: string;
  record_id: string;
  user_id: string;
  action: string;
  changes_summary: any;
  ip_address?: string;
  user_agent_hash?: string;
  severity: string;
  created_at: string;
}

export const SecurityAuditDashboard = () => {
  const { user } = useAuth();

  const { data: auditEvents = [], isLoading } = useQuery({
    queryKey: ['security-audit-trail'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_audit_trail')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching audit trail:', error);
        throw error;
      }
      
      return data as SecurityAuditEvent[];
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'info':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'profile_access':
        return <Eye className="h-4 w-4" />;
      case 'data_encryption':
        return <Shield className="h-4 w-4" />;
      case 'password_security_check':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const criticalEvents = auditEvents.filter(event => 
    event.severity === 'critical' || event.severity === 'high'
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Audit Dashboard
            </CardTitle>
            <CardDescription>Loading security audit data...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Audit Dashboard
          </CardTitle>
          <CardDescription>
            Monitor security events and audit trail for your organization
          </CardDescription>
        </CardHeader>
      </Card>

      {criticalEvents.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Critical Security Events Detected:</strong> {criticalEvents.length} high-priority 
            security events require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Security Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {auditEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No security events recorded yet.</p>
            ) : (
              auditEvents.map((event) => (
                <div key={event.id} className="flex items-start justify-between gap-4 border-b pb-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getEventIcon(event.event_type)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{event.event_type}</span>
                        <Badge variant={getSeverityColor(event.severity) as any} className="text-xs">
                          {event.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Action: {event.action} on {event.table_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                      {event.changes_summary && (
                        <div className="text-xs text-muted-foreground">
                          <details className="cursor-pointer">
                            <summary>Event Details</summary>
                            <pre className="mt-1 text-xs bg-gray-50 p-2 rounded">
                              {JSON.stringify(event.changes_summary, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {event.ip_address && (
                      <p>IP: {event.ip_address}</p>
                    )}
                    {event.user_agent_hash && (
                      <p>UA Hash: {event.user_agent_hash.substring(0, 8)}...</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};