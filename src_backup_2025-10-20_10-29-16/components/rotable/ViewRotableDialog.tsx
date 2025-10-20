import { useRotableParts } from '@/hooks/useRotableParts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const statusColors = {
  installed: 'bg-green-500/20 text-green-400 border-green-500/30',
  in_stock: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  sent_to_oem: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  awaiting_repair: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  serviceable: 'bg-green-500/20 text-green-400 border-green-500/30',
  unserviceable: 'bg-red-500/20 text-red-400 border-red-500/30',
};

interface ViewRotableDialogProps {
  partId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewRotableDialog = ({ partId, open, onOpenChange }: ViewRotableDialogProps) => {
  const { rotableParts } = useRotableParts();
  const part = rotableParts.find(p => p.id === partId);

  if (!part) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-dark border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Rotable Part Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-2">Serial Number</h3>
              <p className="text-white text-lg font-mono">{part.serial_number}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-2">Part Number</h3>
              <p className="text-white text-lg font-mono">{part.part_number}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-2">Manufacturer</h3>
              <p className="text-white">{part.manufacturer}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-2">ATA Chapter</h3>
              <p className="text-white">{part.ata_chapter || 'Not specified'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-2">Status</h3>
              <Badge className={statusColors[part.status]}>
                {part.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-2">Location</h3>
              <p className="text-white">{part.location || 'Not specified'}</p>
            </div>
          </div>

          {part.description && (
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-2">Description</h3>
              <p className="text-white bg-white/5 p-3 rounded-lg">{part.description}</p>
            </div>
          )}

          {part.notes && (
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-2">Notes</h3>
              <p className="text-white bg-white/5 p-3 rounded-lg">{part.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="text-white/60 mb-1">Created</h3>
              <p className="text-white/80">{new Date(part.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-white/60 mb-1">Last Updated</h3>
              <p className="text-white/80">{new Date(part.updated_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/10 text-white/80 hover:bg-white/5"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};