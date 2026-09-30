import { TableShell, Th } from "@/components/ui/table";

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <TableShell minWidth="min-w-0">
      <thead><tr>{head.map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
      <tbody className="align-top">{children}</tbody>
    </TableShell>
  );
}

export const date = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "—");
