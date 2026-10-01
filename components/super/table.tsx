import { Table as UiTable, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/** A staff-console table: the column headings, then rows of `TableRow`/`TableCell` as children. */
export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-md bg-white">
      <UiTable>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {head.map((h, i) => (
              <TableHead key={`${h}-${i}`}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </UiTable>
    </div>
  );
}

export const date = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "—");
