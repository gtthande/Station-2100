import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Calendar, AlertTriangle } from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';

interface Tool {
  id: string;
  name: string;
  sku?: string;
  serial_no?: string;
  status: 'in_stock' | 'checked_out' | 'maintenance' | 'lost';
  calibration_date?: string;
  default_due_hours: number;
  created_at: string;
  updated_at: string;
}

export const ToolsList = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: tools, isLoading } = useQuery({
    queryKey: ['tools'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      return data as Tool[];
    },
    enabled: !!user,
  });

  const filteredTools = tools?.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.serial_no?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tool.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      in_stock: 'secondary',
      checked_out: 'default',
      maintenance: 'destructive',
      lost: 'destructive'
    };
    
    const labels: Record<string, string> = {
      in_stock: 'In Stock',
      checked_out: 'Checked Out',
      maintenance: 'Maintenance',
      lost: 'Lost'
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const isCalibrationDue = (calibrationDate?: string) => {
    if (!calibrationDate) return false;
    const calDate = parseISO(calibrationDate);
    const oneYearFromCal = new Date(calDate.getFullYear() + 1, calDate.getMonth(), calDate.getDate());
    return isAfter(new Date(), oneYearFromCal);
  };

  const getCalibrationStatus = (calibrationDate?: string) => {
    if (!calibrationDate) return null;
    
    if (isCalibrationDue(calibrationDate)) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Due
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary">
        <Calendar className="w-3 h-3 mr-1" />
        Valid
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading tools...</div>;
  }

  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>Tools Inventory</GlassCardTitle>
      </GlassCardHeader>
      
      <GlassCardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
            <Input
              placeholder="Search by name, SKU, or serial number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
          >
            <option value="all">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="checked_out">Checked Out</option>
            <option value="maintenance">Maintenance</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        {/* Tools Table */}
        {filteredTools.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            {searchTerm || statusFilter !== 'all' ? 'No tools found matching your criteria' : 'No tools added yet'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Serial No.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Calibration</TableHead>
                  <TableHead>Due Hours</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTools.map((tool) => (
                  <TableRow key={tool.id}>
                    <TableCell className="font-medium">{tool.name}</TableCell>
                    <TableCell>{tool.sku || '-'}</TableCell>
                    <TableCell>{tool.serial_no || '-'}</TableCell>
                    <TableCell>{getStatusBadge(tool.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {tool.calibration_date ? (
                          <>
                            <span className="text-sm">
                              {format(parseISO(tool.calibration_date), 'MMM dd, yyyy')}
                            </span>
                            {getCalibrationStatus(tool.calibration_date)}
                          </>
                        ) : (
                          <span className="text-white/60">Not set</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{tool.default_due_hours}h</TableCell>
                    <TableCell>{format(parseISO(tool.created_at), 'MMM dd, yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
};