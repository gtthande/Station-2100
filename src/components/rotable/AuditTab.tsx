import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useRotableRoles } from '@/hooks/useRotableRoles';
import { FeatureGate } from '@/components/auth/FeatureGate';
import { 
  Shield, 
  Search, 
  Filter, 
  Eye, 
  Calendar,
  User,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

export const AuditTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const { auditLogs, isLoading } = useAuditLogs();
  const { canViewAuditLogs } = useRotableRoles();

  if (!canViewAuditLogs) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-white/60">Access denied. You need Manager or Auditor role to view audit logs.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/60">Loading audit logs...</div>
      </div>
    );
  }

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.action_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = actionTypeFilter === '' || log.action_type === actionTypeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return <Activity className="w-4 h-4 text-green-500" />;
      case 'updated':
        return <Activity className="w-4 h-4 text-blue-500" />;
      case 'installed':
        return <Activity className="w-4 h-4 text-purple-500" />;
      case 'removed':
        return <Activity className="w-4 h-4 text-red-500" />;
      case 'document_uploaded':
        return <Activity className="w-4 h-4 text-cyan-500" />;
      case 'status_changed':
        return <Activity className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-white/60" />;
    }
  };

  const actionTypes = Array.from(new Set(auditLogs.map(log => log.action_type)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Audit Trail
        </h3>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
              <Input
                placeholder="Search audit logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
              <SelectTrigger className="w-48 bg-white/5 border-white/20 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Actions</SelectItem>
                {actionTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Audit Log Entries ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60">No audit log entries found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log.id} className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getActionIcon(log.action_type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="capitalize">
                            {log.action_type.replace('_', ' ')}
                          </Badge>
                          <span className="text-white/60 text-sm flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(log.created_at), 'PPp')}
                          </span>
                        </div>
                        
                        <p className="text-white mb-2">{log.action_description}</p>
                        
                        <div className="text-sm text-white/60 space-y-1">
                          {log.performed_by && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Performed by: {log.performed_by}
                            </div>
                          )}
                          {log.ip_address && (
                            <div>IP Address: {log.ip_address}</div>
                          )}
                          {log.related_table && (
                            <div>Related: {log.related_table}</div>
                          )}
                        </div>

                        {(log.old_values || log.new_values) && (
                          <div className="mt-3 p-3 bg-white/5 rounded border border-white/10">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              {log.old_values && (
                                <div>
                                  <span className="text-white/60 font-medium">Old Values:</span>
                                  <pre className="text-white/80 mt-1 whitespace-pre-wrap">
                                    {JSON.stringify(log.old_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_values && (
                                <div>
                                  <span className="text-white/60 font-medium">New Values:</span>
                                  <pre className="text-white/80 mt-1 whitespace-pre-wrap">
                                    {JSON.stringify(log.new_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Eye className="w-4 h-4" />
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};