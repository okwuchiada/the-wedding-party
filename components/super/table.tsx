export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[6px] bg-white">
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-foreground/55">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-3 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-(--m-mist) align-top">{children}</tbody>
      </table>
    </div>
  );
}

export const date = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "—");
