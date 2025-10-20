import { useState } from 'react';
import { useRotableParts } from '@/hooks/useRotableParts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye } from 'lucide-react';
import { EditRotableDialog } from './EditRotableDialog';
import { ViewRotableDialog } from './ViewRotableDialog';

const statusColors = {
  installed: 'bg-green-500/20 text-green-400 border-green-500/30',
  in_stock: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  sent_to_oem: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  awaiting_repair: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  serviceable: 'bg-green-500/20 text-green-400 border-green-500/30',
  unserviceable: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const RotablePartsList = () => {
  const { rotableParts, isLoading, deletePart } = useRotableParts();
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [viewPart, setViewPart] = useState<string | null>(null);

  if (isLoading) {
    return <div className="text-white/60">Loading rotable parts...</div>;
  }

  if (rotableParts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-white/60 mb-4">No rotable parts found</p>
        <p className="text-white/40 text-sm">Add your first rotable part to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="text-white/80">Serial Number</TableHead>
              <TableHead className="text-white/80">Part Number</TableHead>
              <TableHead className="text-white/80">Manufacturer</TableHead>
              <TableHead className="text-white/80">ATA Chapter</TableHead>
              <TableHead className="text-white/80">Status</TableHead>
              <TableHead className="text-white/80">Location</TableHead>
              <TableHead className="text-white/80">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rotableParts.map((part) => (
              <TableRow key={part.id} className="border-white/10">
                <TableCell className="text-white font-medium">{part.serial_number}</TableCell>
                <TableCell className="text-white/80">{part.part_number}</TableCell>
                <TableCell className="text-white/80">{part.manufacturer}</TableCell>
                <TableCell className="text-white/80">{part.ata_chapter || '-'}</TableCell>
                <TableCell>
                  <Badge className={statusColors[part.status]}>
                    {part.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-white/80">{part.location || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewPart(part.id)}
                      className="text-white/60 hover:text-white hover:bg-white/10"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPart(part.id)}
                      className="text-white/60 hover:text-white hover:bg-white/10"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePart(part.id)}
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

      {selectedPart && (
        <EditRotableDialog
          partId={selectedPart}
          open={!!selectedPart}
          onOpenChange={() => setSelectedPart(null)}
        />
      )}

      {viewPart && (
        <ViewRotableDialog
          partId={viewPart}
          open={!!viewPart}
          onOpenChange={() => setViewPart(null)}
        />
      )}
    </>
  );
};