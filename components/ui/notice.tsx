import { Alert } from "@/components/ui/alert";

const VARIANT = { info: "default", success: "success", error: "destructive", warning: "warning" } as const;

/** A shadcn Alert with an optional action on the right. Only errors interrupt screen readers. */
export function Notice({ tone = "info", children, action }: { tone?: keyof typeof VARIANT; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Alert variant={VARIANT[tone]} role={tone === "error" ? "alert" : "status"} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 font-medium">
      <div className="min-w-0">{children}</div>
      {action}
    </Alert>
  );
}
