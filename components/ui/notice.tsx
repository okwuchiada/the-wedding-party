const TONES = {
  info: "bg-surface-muted text-ink",
  success: "bg-success/10 text-success",
  error: "bg-danger/10 text-danger",
  warning: "bg-action/20 text-warning",
} as const;

export function Notice({ tone = "info", children, action }: { tone?: keyof typeof TONES; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex flex-wrap items-center justify-between gap-3 rounded-[6px] px-4 py-3 text-sm font-medium ${TONES[tone]}`}>
      <div className="min-w-0">{children}</div>
      {action}
    </div>
  );
}
