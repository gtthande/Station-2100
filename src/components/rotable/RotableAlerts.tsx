import { useRotableAlerts } from '@/hooks/useRotableAlerts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const alertTypeColors = {
  calendar_time: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  flight_hours: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  flight_cycles: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export const RotableAlerts = () => {
  const { alerts, isLoading, acknowledgeAlert, isAcknowledging } = useRotableAlerts();

  if (isLoading) {
    return <div className="text-white/60">Loading alerts...</div>;
  }

  const pendingAlerts = alerts.filter(alert => !alert.is_acknowledged);
  const acknowledgedAlerts = alerts.filter(alert => alert.is_acknowledged);

  return (
    <div className="space-y-8">
      {/* Pending Alerts */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-white">Pending Alerts ({pendingAlerts.length})</h3>
        </div>

        {pendingAlerts.length === 0 ? (
          <div className="text-center py-6 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-green-400 font-medium">No pending alerts</p>
            <p className="text-white/60 text-sm">All rotable parts are within limits</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white/80">Part S/N</TableHead>
                  <TableHead className="text-white/80">Alert Type</TableHead>
                  <TableHead className="text-white/80">Current Value</TableHead>
                  <TableHead className="text-white/80">Threshold</TableHead>
                  <TableHead className="text-white/80">Alert Date</TableHead>
                  <TableHead className="text-white/80">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingAlerts.map((alert) => (
                  <TableRow key={alert.id} className="border-white/10 bg-orange-500/5">
                    <TableCell className="text-white font-medium">
                      {alert.rotable_parts?.serial_number || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={alertTypeColors[alert.alert_type as keyof typeof alertTypeColors] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>
                        {alert.alert_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/80">{alert.current_value || 'N/A'}</TableCell>
                    <TableCell className="text-white/80">{alert.threshold_value || 'N/A'}</TableCell>
                    <TableCell className="text-white/80">
                      {alert.alert_date ? new Date(alert.alert_date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                        disabled={isAcknowledging}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isAcknowledging ? 'Acknowledging...' : 'Acknowledge'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Acknowledged Alerts */}
      {acknowledgedAlerts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-white">Recent Acknowledged Alerts</h3>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white/80">Part S/N</TableHead>
                  <TableHead className="text-white/80">Alert Type</TableHead>
                  <TableHead className="text-white/80">Alert Date</TableHead>
                  <TableHead className="text-white/80">Acknowledged</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acknowledgedAlerts.slice(0, 10).map((alert) => (
                  <TableRow key={alert.id} className="border-white/10 opacity-60">
                    <TableCell className="text-white font-medium">
                      {alert.rotable_parts?.serial_number || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={alertTypeColors[alert.alert_type as keyof typeof alertTypeColors] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>
                        {alert.alert_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/80">
                      {alert.alert_date ? new Date(alert.alert_date).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-white/80">
                      {alert.acknowledged_at ? new Date(alert.acknowledged_at).toLocaleDateString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};