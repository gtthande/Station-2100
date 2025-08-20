import { useState } from 'react';
import { useInventoryPooling } from '@/hooks/useInventoryPooling';
import { useRotableParts } from '@/hooks/useRotableParts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Trash2, Plus, MapPin } from 'lucide-react';
import { AddPooledPartDialog } from './AddPooledPartDialog';
import { AddLocationDialog } from './AddLocationDialog';

const statusColors = {
  installed: 'bg-green-500/20 text-green-400 border-green-500/30',
  in_stock: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  sent_to_oem: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  awaiting_repair: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  serviceable: 'bg-green-500/20 text-green-400 border-green-500/30',
  unserviceable: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const InventoryPoolingTab = () => {
  const { pooledParts, warehouseLocations, isLoading, deletePooledPart } = useInventoryPooling();
  const { rotableParts } = useRotableParts();
  const [showAddPoolDialog, setShowAddPoolDialog] = useState(false);
  const [showAddLocationDialog, setShowAddLocationDialog] = useState(false);

  if (isLoading) {
    return <div className="text-white/60">Loading inventory & pooling data...</div>;
  }

  const stockSummary = rotableParts.reduce((acc, part) => {
    const status = part.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Tabs defaultValue="stock" className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
        <TabsTrigger value="stock" className="data-[state=active]:bg-primary data-[state=active]:text-white">
          Current Stock
        </TabsTrigger>
        <TabsTrigger value="pooling" className="data-[state=active]:bg-primary data-[state=active]:text-white">
          Pooled Parts
        </TabsTrigger>
        <TabsTrigger value="locations" className="data-[state=active]:bg-primary data-[state=active]:text-white">
          Warehouse Locations
        </TabsTrigger>
      </TabsList>

      <TabsContent value="stock" className="mt-6">
        <div className="space-y-6">
          {/* Stock Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(stockSummary).map(([status, count]) => (
              <div key={status} className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">{count}</div>
                <div className="text-sm text-white/60 capitalize">{status.replace('_', ' ')}</div>
              </div>
            ))}
          </div>

          {/* Current Stock Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white/80">Serial Number</TableHead>
                  <TableHead className="text-white/80">Part Number</TableHead>
                  <TableHead className="text-white/80">Manufacturer</TableHead>
                  <TableHead className="text-white/80">Status</TableHead>
                  <TableHead className="text-white/80">Location</TableHead>
                  <TableHead className="text-white/80">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rotableParts.map((part) => (
                  <TableRow key={part.id} className="border-white/10">
                    <TableCell className="text-white font-medium">{part.serial_number}</TableCell>
                    <TableCell className="text-white/80">{part.part_number}</TableCell>
                    <TableCell className="text-white/80">{part.manufacturer}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[part.status]}>
                        {part.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/80">{part.location || '-'}</TableCell>
                    <TableCell className="text-white/80">{part.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="pooling" className="mt-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Pooled Parts Management</h3>
            <Button onClick={() => setShowAddPoolDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add to Pool
            </Button>
          </div>

          {pooledParts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/60 mb-4">No pooled parts found</p>
              <p className="text-white/40 text-sm">Add parts to pools for sharing with other operators</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white/80">Part S/N</TableHead>
                    <TableHead className="text-white/80">Pool Name</TableHead>
                    <TableHead className="text-white/80">Pool Operator</TableHead>
                    <TableHead className="text-white/80">Available</TableHead>
                    <TableHead className="text-white/80">Priority</TableHead>
                    <TableHead className="text-white/80">Cost/Hour</TableHead>
                    <TableHead className="text-white/80">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pooledParts.map((pooledPart) => (
                    <TableRow key={pooledPart.id} className="border-white/10">
                      <TableCell className="text-white font-medium">
                        {pooledPart.rotable_parts?.serial_number || 'N/A'}
                      </TableCell>
                      <TableCell className="text-white/80">{pooledPart.pool_name}</TableCell>
                      <TableCell className="text-white/80">{pooledPart.pool_operator || '-'}</TableCell>
                      <TableCell>
                        <Badge className={pooledPart.available_for_pool ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                          {pooledPart.available_for_pool ? 'Available' : 'Not Available'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white/80">{pooledPart.pool_priority}</TableCell>
                      <TableCell className="text-white/80">{pooledPart.usage_cost_per_hour || '-'}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePooledPart(pooledPart.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="locations" className="mt-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Warehouse Locations</h3>
            <Button onClick={() => setShowAddLocationDialog(true)} className="gap-2">
              <MapPin className="w-4 h-4" />
              Update Location
            </Button>
          </div>

          {warehouseLocations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/60 mb-4">No warehouse locations recorded</p>
              <p className="text-white/40 text-sm">Track detailed warehouse, shelf, and bin locations</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white/80">Part S/N</TableHead>
                    <TableHead className="text-white/80">Warehouse</TableHead>
                    <TableHead className="text-white/80">Aisle</TableHead>
                    <TableHead className="text-white/80">Shelf</TableHead>
                    <TableHead className="text-white/80">Bin</TableHead>
                    <TableHead className="text-white/80">Moved Date</TableHead>
                    <TableHead className="text-white/80">Moved By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouseLocations.map((location) => (
                    <TableRow key={location.id} className="border-white/10">
                      <TableCell className="text-white font-medium">
                        {location.rotable_parts?.serial_number || 'N/A'}
                      </TableCell>
                      <TableCell className="text-white/80">{location.warehouse_code}</TableCell>
                      <TableCell className="text-white/80">{location.aisle || '-'}</TableCell>
                      <TableCell className="text-white/80">{location.shelf || '-'}</TableCell>
                      <TableCell className="text-white/80">{location.bin || '-'}</TableCell>
                      <TableCell className="text-white/80">
                        {new Date(location.moved_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-white/80">{location.moved_by_name || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </TabsContent>

      <AddPooledPartDialog 
        open={showAddPoolDialog} 
        onOpenChange={setShowAddPoolDialog} 
      />

      <AddLocationDialog 
        open={showAddLocationDialog} 
        onOpenChange={setShowAddLocationDialog} 
      />
    </Tabs>
  );
};