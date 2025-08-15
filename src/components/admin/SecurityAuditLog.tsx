import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Shield, Eye, AlertTriangle } from "lucide-react";

interface ProfileAccessLog {
  id: string;
  accessed_profile_id: string;
  accessed_by: string;
  access_time: string;
  access_type: string;
  user_agent?: string;
  ip_address?: string;
}

export function SecurityAuditLog() {
  const { user } = useAuth();
  const { isAdmin } = useUserRoles();

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['profile-access-logs'],
    queryFn: async () => {
      if (!user?.id || !isAdmin) return [];
      
      const { data, error } = await supabase
        .from('profile_access_log')
        .select('*')
        .order('access_time', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching audit logs:', error);
        throw error;
      }
      
      return data as ProfileAccessLog[];
    },
    enabled: !!user?.id && isAdmin,
  });

  const { data: profiles } = useQuery({
    queryKey: ['profiles-for-audit'],
    queryFn: async () => {
      if (!user?.id || !isAdmin) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('email');

      if (error) {
        console.error('Error fetching profiles for audit:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.id && isAdmin,
  });

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You need administrator privileges to view security audit logs.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Audit Logs...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const getProfileName = (profileId: string) => {
    const profile = profiles?.find(p => p.id === profileId);
    return profile ? `${profile.full_name || profile.email}` : 'Unknown User';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Audit Log
          <Badge variant="secondary" className="ml-2">
            Profile Access Monitoring
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Monitor unauthorized access attempts to employee personal information
        </p>
      </CardHeader>
      <CardContent>
        {auditLogs && auditLogs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Accessed Profile</TableHead>
                <TableHead>Accessed By</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.access_time), 'MMM dd, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>{getProfileName(log.accessed_profile_id)}</TableCell>
                  <TableCell>{getProfileName(log.accessed_by)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {log.access_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Cross-User Access
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No profile access violations detected</p>
            <p className="text-sm">This is good news - your employee data is secure!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}