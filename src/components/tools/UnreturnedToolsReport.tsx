
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Loan = {
  id: string;
  tool_id: string;
  borrower_user_id: string;
  issuer_user_id: string;
  checkout_at: string;
  due_at: string;
  returned_at: string | null;
  notes: string | null;
};

type Tool = {
  id: string;
  name: string;
  serial_no: string | null;
  sku: string | null;
};

function formatDate(val?: string | null) {
  if (!val) return '-';
  const d = new Date(val);
  return d.toLocaleString();
}

function daysOverdue(dueAt?: string | null) {
  if (!dueAt) return 0;
  const due = new Date(dueAt).getTime();
  const now = Date.now();
  if (now <= due) return 0;
  return Math.ceil((now - due) / (1000 * 60 * 60 * 24));
}

interface Props { compact?: boolean }

const UnreturnedToolsReport = ({ compact }: Props) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tools-unreturned'],
    queryFn: async () => {
      const { data: loans, error: e1 } = await supabase
        .from('tool_loans')
        .select('id, tool_id, borrower_user_id, issuer_user_id, checkout_at, due_at, returned_at, notes')
        .is('returned_at', null)
        .order('due_at', { ascending: true });
      if (e1) throw e1;

      const toolIds = Array.from(new Set((loans || []).map(l => l.tool_id)));
      let toolsMap: Record<string, Tool> = {};
      if (toolIds.length) {
        const { data: tools, error: e2 } = await supabase
          .from('tools')
          .select('id, name, serial_no, sku')
          .in('id', toolIds);
        if (e2) throw e2;
        toolsMap = Object.fromEntries((tools || []).map(t => [t.id, t]));
      }

      return { loans: loans as Loan[], toolsMap };
    },
  });

  const rows = useMemo(() => {
    const loans = data?.loans || [];
    return loans.map(l => {
      const t = data?.toolsMap[l.tool_id];
      return {
        id: l.id,
        toolName: t?.name || l.tool_id,
        toolSku: t?.sku,
        serial: t?.serial_no,
        checkoutAt: l.checkout_at,
        dueAt: l.due_at,
        overdue: daysOverdue(l.due_at),
        notes: l.notes || '',
      };
    });
  }, [data]);

  if (isLoading) return <p className="text-white/70">Loading unreturned tools…</p>;
  if (error) return <p className="text-red-400">Failed to load unreturned tools.</p>;
  if (!rows.length) return <p className="text-white/70">All tools have been returned. Great job!</p>;

  return (
    <div className={compact ? '' : 'bg-surface-dark/40 rounded-xl border border-white/10 p-4'}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-white/70">Tool</TableHead>
            <TableHead className="text-white/70">Serial/SKU</TableHead>
            <TableHead className="text-white/70">Checked Out</TableHead>
            <TableHead className="text-white/70">Due</TableHead>
            <TableHead className="text-white/70">Overdue (days)</TableHead>
            <TableHead className="text-white/70">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.id}>
              <TableCell className="text-white">{r.toolName}</TableCell>
              <TableCell className="text-white/80">{r.serial || r.toolSku || '-'}</TableCell>
              <TableCell className="text-white/80">{formatDate(r.checkoutAt)}</TableCell>
              <TableCell className="text-white/80">{formatDate(r.dueAt)}</TableCell>
              <TableCell className={r.overdue > 0 ? 'text-red-400' : 'text-white/80'}>{r.overdue}</TableCell>
              <TableCell className="text-white/70">{r.notes}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UnreturnedToolsReport;
