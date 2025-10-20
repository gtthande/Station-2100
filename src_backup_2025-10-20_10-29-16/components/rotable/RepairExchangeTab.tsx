import { useState } from 'react';
import { useRepairExchange } from '@/hooks/useRepairExchange';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus } from 'lucide-react';
import { AddRepairExchangeDialog } from './AddRepairExchangeDialog';
import { EditRepairExchangeDialog } from './EditRepairExchangeDialog';
import { useCurrency } from '@/hooks/useCurrency';

const statusColors = {
  sent: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  returned: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const recordTypeColors = {
  repair: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  exchange: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  overhaul: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const RepairExchangeTab = () => {
  const { records, isLoading, deleteRecord } = useRepairExchange();
  const { formatCurrency } = useCurrency();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);

  if (isLoading) {
    return <div className="text-white/60">Loading repair & exchange records...</div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Repair & Exchange Records</h3>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Record
        </Button>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-white/60 mb-4">No repair & exchange records found</p>
          <p className="text-white/40 text-sm">Add records to track parts sent to OEM/MRO facilities</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-white/80">Part S/N</TableHead>
                <TableHead className="text-white/80">Type</TableHead>
                <TableHead className="text-white/80">Facility</TableHead>
                <TableHead className="text-white/80">Sent Date</TableHead>
                <TableHead className="text-white/80">Status</TableHead>
                <TableHead className="text-white/80">Cost</TableHead>
                <TableHead className="text-white/80">Work Order</TableHead>
                <TableHead className="text-white/80">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id} className="border-white/10">
                  <TableCell className="text-white font-medium">
                    {record.rotable_parts?.serial_number || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge className={recordTypeColors[record.record_type]}>
                      {record.record_type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white/80">{record.sent_to_facility}</TableCell>
                  <TableCell className="text-white/80">
                    {new Date(record.sent_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[record.status]}>
                      {record.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white/80">
                    {record.cost ? formatCurrency(record.cost) : '-'}
                  </TableCell>
                  <TableCell className="text-white/80">{record.work_order_number || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRecord(record.id)}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRecord(record.id)}
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

      <AddRepairExchangeDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
      />

      {selectedRecord && (
        <EditRepairExchangeDialog
          recordId={selectedRecord}
          open={!!selectedRecord}
          onOpenChange={() => setSelectedRecord(null)}
        />
      )}
    </>
  );
};