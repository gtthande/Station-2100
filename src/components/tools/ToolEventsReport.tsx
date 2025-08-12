
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface EventRow {
  id: string;
  tool_id: string;
  event_type: string;
  at: string;
}

interface Tool { id: string; name: string; serial_no: string | null }

function formatDate(val?: string | null) {
  if (!val) return '-';
  const d = new Date(val);
  return d.toLocaleString();
}

interface Props { compact?: boolean }

const ToolEventsReport = ({ compact }: Props) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tools-events'],
    queryFn: async () => {
      const { data: events, error: e1 } = await supabase
        .from('tool_events')
        .select('id, tool_id, event_type, at')
        .order('at', { ascending: false })
        .limit(200);
      if (e1) throw e1;

      const toolIds = Array.from(new Set((events || []).map(e => e.tool_id)));
      let toolsMap: Record<string, Tool> = {};
      if (toolIds.length) {
        const { data: tools, error: e2 } = await supabase
          .from('tools')
          .select('id, name, serial_no')
          .in('id', toolIds);
        if (e2) throw e2;
        toolsMap = Object.fromEntries((tools || []).map(t => [t.id, t]));
      }

      return { events: (events || []) as EventRow[], toolsMap };
    },
  });

  const rows = useMemo(() => {
    const evs = data?.events || [];
    return evs.map(e => ({
      id: e.id,
      toolName: data?.toolsMap[e.tool_id]?.name || e.tool_id,
      serial: data?.toolsMap[e.tool_id]?.serial_no || null,
      event: e.event_type,
      at: e.at,
    }));
  }, [data]);

  if (isLoading) return <p className="text-white/70">Loading tool activity…</p>;
  if (error) return <p className="text-red-400">Failed to load tool activity.</p>;
  if (!rows.length) return <p className="text-white/70">No tool events yet.</p>;

  return (
    <div className={compact ? '' : 'bg-surface-dark/40 rounded-xl border border-white/10 p-4'}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-white/70">Tool</TableHead>
            <TableHead className="text-white/70">Serial</TableHead>
            <TableHead className="text-white/70">Event</TableHead>
            <TableHead className="text-white/70">At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.id}>
              <TableCell className="text-white">{r.toolName}</TableCell>
              <TableCell className="text-white/80">{r.serial || '-'}</TableCell>
              <TableCell className="text-white/80 capitalize">{r.event.replace('_', ' ')}</TableCell>
              <TableCell className="text-white/80">{formatDate(r.at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ToolEventsReport;
