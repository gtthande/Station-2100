import { useState } from 'react';
import { useInstallationRemovalLogs } from '@/hooks/useInstallationLogs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus } from 'lucide-react';
import { AddInstallationLogDialog } from './AddInstallationLogDialog';
import { EditInstallationLogDialog } from './EditInstallationLogDialog';

const logTypeColors = {
  installation: 'bg-green-500/20 text-green-400 border-green-500/30',
  removal: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const InstallationLogsTab = () => {
  const { logs, isLoading, deleteLog } = useInstallationRemovalLogs();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<string | null>(null);

  if (isLoading) {
    return <div className="text-white/60">Loading installation/removal logs...</div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Installation & Removal History</h3>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Log Entry
        </Button>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-white/60 mb-4">No installation/removal logs found</p>
          <p className="text-white/40 text-sm">Add log entries to track part installation and removal history</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-white/80">Part S/N</TableHead>
                <TableHead className="text-white/80">Type</TableHead>
                <TableHead className="text-white/80">Aircraft ID</TableHead>
                <TableHead className="text-white/80">Date</TableHead>
                <TableHead className="text-white/80">Hours</TableHead>
                <TableHead className="text-white/80">Cycles</TableHead>
                <TableHead className="text-white/80">Performed By</TableHead>
                <TableHead className="text-white/80">Reason</TableHead>
                <TableHead className="text-white/80">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="border-white/10">
                  <TableCell className="text-white font-medium">
                    {log.rotable_parts?.serial_number || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge className={logTypeColors[log.log_type]}>
                      {log.log_type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white/80">{log.aircraft_id}</TableCell>
                  <TableCell className="text-white/80">
                    {new Date(log.log_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-white/80">{log.flight_hours_at_action || '-'}</TableCell>
                  <TableCell className="text-white/80">{log.flight_cycles_at_action || '-'}</TableCell>
                  <TableCell className="text-white/80">{log.performed_by_name || '-'}</TableCell>
                  <TableCell className="text-white/80">{log.reason_for_removal || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log.id)}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteLog(log.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddInstallationLogDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
      />

      {selectedLog && (
        <EditInstallationLogDialog
          logId={selectedLog}
          open={!!selectedLog}
          onOpenChange={() => setSelectedLog(null)}
        />
      )}
    </>
  );
};