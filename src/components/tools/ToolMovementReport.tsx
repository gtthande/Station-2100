import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Download, Search, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface MovementRecord {
  event_id: string;
  at: string;
  tool_id: string;
  tool_name: string;
  sku?: string;
  serial_no?: string;
  event: string;
  from_holder: string;
  to_holder: string;
  issuer_name?: string;
  actor_name?: string;
}

export const ToolMovementReport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState({
    start_date: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    tool_id: '',
    event_type: '',
    holder: ''
  });

  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  // Fetch available tools for filter
  const { data: tools } = useQuery({
    queryKey: ['tools-list'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('tools')
        .select('id, name, sku')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch movement data
  const { data: movements, isLoading, refetch, error } = useQuery({
    queryKey: ['tool-movements', filters],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('Fetching tool movements with filters:', filters);
      
      let query = supabase
        .from('v_tool_movement')
        .select('*')
        .eq('user_id', user.id)
        .gte('at', filters.start_date + 'T00:00:00')
        .lte('at', filters.end_date + 'T23:59:59')
        .order('at', { ascending: false });

      if (filters.tool_id) {
        query = query.eq('tool_id', filters.tool_id);
      }

      if (filters.event_type) {
        query = query.eq('event', filters.event_type as any);
      }

      const { data, error } = await query;
      
      console.log('Tool movements query result:', { data, error, count: data?.length });
      
      if (error) {
        console.error('Tool movements query error:', error);
        throw error;
      }
      
      return data as MovementRecord[];
    },
    enabled: !!user && !!filters.start_date && !!filters.end_date,
  });

  // Fetch tool-specific movements for drilldown
  const { data: toolMovements } = useQuery({
    queryKey: ['tool-movements-detail', selectedTool, filters.start_date, filters.end_date],
    queryFn: async () => {
      if (!user || !selectedTool) return [];
      
      const { data, error } = await supabase
        .from('v_tool_movement')
        .select('*')
        .eq('user_id', user.id)
        .eq('tool_id', selectedTool)
        .gte('at', filters.start_date + 'T00:00:00')
        .lte('at', filters.end_date + 'T23:59:59')
        .order('at', { ascending: false });

      if (error) throw error;
      return data as MovementRecord[];
    },
    enabled: !!user && !!selectedTool,
  });

  const handleQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    setFilters(prev => ({
      ...prev,
      start_date: format(start, 'yyyy-MM-dd'),
      end_date: format(end, 'yyyy-MM-dd')
    }));
  };

  const exportToCSV = () => {
    if (!movements?.length) {
      toast({
        title: "No Data",
        description: "No movement data to export",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Date/Time', 'Tool', 'From', 'To', 'Event', 'Issuer'];
    const csvData = movements.map(record => [
      format(new Date(record.at), 'yyyy-MM-dd HH:mm:ss'),
      `${record.tool_name}${record.sku ? ` (${record.sku})` : ''}`,
      record.from_holder,
      record.to_holder,
      record.event,
      record.issuer_name || record.actor_name || 'System'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tool-movements-${filters.start_date}-to-${filters.end_date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getEventBadge = (event: string): 'default' | 'secondary' | 'destructive' => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      checkout: 'default',
      return: 'secondary',
      transfer: 'default',
      overdue: 'destructive'
    };
    return variants[event] || 'default';
  };

  return (
    <div className="space-y-6">
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Tool Movement Report
          </GlassCardTitle>
        </GlassCardHeader>
        
        <GlassCardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <Label htmlFor="tool_filter">Tool</Label>
              <Select value={filters.tool_id} onValueChange={(value) => setFilters(prev => ({ ...prev, tool_id: value }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="All tools" />
                </SelectTrigger>
                <SelectContent className="bg-surface-dark border-white/20">
                  <SelectItem value="" className="text-white">All tools</SelectItem>
                  {tools?.map((tool) => (
                    <SelectItem key={tool.id} value={tool.id} className="text-white">
                      {tool.name} {tool.sku && `(${tool.sku})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="event_filter">Event Type</Label>
              <Select value={filters.event_type} onValueChange={(value) => setFilters(prev => ({ ...prev, event_type: value }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent className="bg-surface-dark border-white/20">
                  <SelectItem value="" className="text-white">All events</SelectItem>
                  <SelectItem value="checkout" className="text-white">Checkout</SelectItem>
                  <SelectItem value="return" className="text-white">Return</SelectItem>
                  <SelectItem value="transfer" className="text-white">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={() => refetch()} className="bg-primary hover:bg-primary/80">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Quick Range Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleQuickRange(1)}>Today</Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickRange(7)}>7 Days</Button>
            <Button variant="outline" size="sm" onClick={() => handleQuickRange(30)}>30 Days</Button>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <Button onClick={exportToCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Results Table */}
      <GlassCard>
        <GlassCardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading movements...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">
              Error loading movements: {error.message}
            </div>
          ) : !movements?.length ? (
            <div className="text-center py-8 text-white/60">No movements found for the selected criteria</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Tool</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Issuer</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((record) => (
                  <TableRow key={record.event_id}>
                    <TableCell>{format(new Date(record.at), 'MMM dd, yyyy HH:mm')}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.tool_name}</div>
                        {record.sku && <div className="text-sm text-white/60">SKU: {record.sku}</div>}
                        {record.serial_no && <div className="text-sm text-white/60">S/N: {record.serial_no}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{record.from_holder}</TableCell>
                    <TableCell>{record.to_holder}</TableCell>
                    <TableCell>
                      <Badge variant={getEventBadge(record.event)} className="capitalize">
                        {record.event}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.issuer_name || record.actor_name || 'System'}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTool(record.tool_id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl bg-surface-dark border-white/20">
                          <DialogHeader>
                            <DialogTitle className="text-white">
                              {record.tool_name} - Movement History
                            </DialogTitle>
                          </DialogHeader>
                          <div className="max-h-96 overflow-y-auto">
                            {toolMovements?.length ? (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Date/Time</TableHead>
                                    <TableHead>From</TableHead>
                                    <TableHead>To</TableHead>
                                    <TableHead>Event</TableHead>
                                    <TableHead>Issuer</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {toolMovements.map((movement) => (
                                    <TableRow key={movement.event_id}>
                                      <TableCell>{format(new Date(movement.at), 'MMM dd, yyyy HH:mm')}</TableCell>
                                      <TableCell>{movement.from_holder}</TableCell>
                                      <TableCell>{movement.to_holder}</TableCell>
                                      <TableCell>
                                        <Badge variant={getEventBadge(movement.event)} className="capitalize">
                                          {movement.event}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>{movement.issuer_name || movement.actor_name || 'System'}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <div className="text-center py-4 text-white/60">No movements found</div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
};