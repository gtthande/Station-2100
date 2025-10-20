import { useState } from 'react';
import { useFlightTracking } from '@/hooks/useFlightTracking';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus } from 'lucide-react';
import { AddFlightTrackingDialog } from './AddFlightTrackingDialog';
import { EditFlightTrackingDialog } from './EditFlightTrackingDialog';

export const FlightTrackingList = () => {
  const { flightTracking, isLoading, deleteTracking } = useFlightTracking();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTracking, setSelectedTracking] = useState<string | null>(null);

  if (isLoading) {
    return <div className="text-white/60">Loading flight tracking records...</div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Flight Tracking Records</h3>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Tracking Record
        </Button>
      </div>

      {flightTracking.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-white/60 mb-4">No flight tracking records found</p>
          <p className="text-white/40 text-sm">Add tracking records to monitor flight time and cycles</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-white/80">Part S/N</TableHead>
                <TableHead className="text-white/80">Aircraft</TableHead>
                <TableHead className="text-white/80">Flight Hours</TableHead>
                <TableHead className="text-white/80">Cycles</TableHead>
                <TableHead className="text-white/80">Installation Date</TableHead>
                <TableHead className="text-white/80">Next Inspection</TableHead>
                <TableHead className="text-white/80">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flightTracking.map((tracking) => (
                <TableRow key={tracking.id} className="border-white/10">
                  <TableCell className="text-white font-medium">
                    {tracking.rotable_parts?.serial_number || 'N/A'}
                  </TableCell>
                  <TableCell className="text-white/80">{tracking.aircraft_tail_number}</TableCell>
                  <TableCell className="text-white/80">{tracking.flight_hours}</TableCell>
                  <TableCell className="text-white/80">{tracking.flight_cycles}</TableCell>
                  <TableCell className="text-white/80">
                    {tracking.installation_date ? new Date(tracking.installation_date).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-white/80">
                    {tracking.next_inspection_due ? new Date(tracking.next_inspection_due).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTracking(tracking.id)}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTracking(tracking.id)}
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

      <AddFlightTrackingDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
      />

      {selectedTracking && (
        <EditFlightTrackingDialog
          trackingId={selectedTracking}
          open={!!selectedTracking}
          onOpenChange={() => setSelectedTracking(null)}
        />
      )}
    </>
  );
};