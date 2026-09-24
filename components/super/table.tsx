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

export function SearchForm({ q, placeholder, children }: { q?: string; placeholder: string; children?: React.ReactNode }) {
  return (
    <form method="GET" className="flex flex-wrap gap-2">
      <input
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        className="min-w-60 flex-1 border border-(--m-mist) bg-white px-3 py-2 text-sm outline-none focus:border-(--m-ink)/50"
      />
      {children}
      <button type="submit" className="border rounded-full border-(--m-ink)/25 px-4 py-2 text-xs font-medium hover:border-(--m-ink)">
        Search
      </button>
    </form>
  );
}

export const date = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "—");
