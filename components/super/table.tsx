export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto bg-white">
      <table className="w-full text-left text-sm">
        <thead className="text-[11px] tracking-[.1em] text-foreground/55 uppercase">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-3 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-olive/10 align-top">{children}</tbody>
      </table>
    </div>
  );
}

export function SearchForm({ q, placeholder, children }: { q?: string; placeholder: string; children?: React.ReactNode }) {
  return (
    <form method="GET" className="flex flex-wrap gap-2">
      <input
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        className="min-w-60 flex-1 border border-olive/20 bg-white px-3 py-2 text-sm outline-none focus:border-olive"
      />
      {children}
      <button type="submit" className="border border-olive/30 px-4 py-2 text-xs font-medium hover:border-burnt-orange">
        Search
      </button>
    </form>
  );
}

export const date = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "—");
