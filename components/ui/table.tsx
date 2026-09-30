export function TableShell({ children, minWidth = "min-w-150" }: { children: React.ReactNode; minWidth?: string }) {
  return (
    <div className="relative overflow-x-auto rounded-[8px] border border-line bg-surface">
      <table className={`w-full ${minWidth} text-left text-sm`}>{children}</table>
    </div>
  );
}

export function Th({ children, numeric = false }: { children?: React.ReactNode; numeric?: boolean }) {
  return <th scope="col" className={`border-b border-line px-4 py-3 text-[13px] font-semibold text-muted ${numeric ? "text-right" : ""}`}>{children}</th>;
}

export function Td({ children, numeric = false, className = "" }: { children?: React.ReactNode; numeric?: boolean; className?: string }) {
  return <td className={`border-b border-line px-4 py-3 align-middle text-ink ${numeric ? "text-right tabular-nums" : ""} ${className}`}>{children}</td>;
}
