import { Card, CardDescription, CardTitle } from "@/components/ui/card";

/** What an empty list shows: a dashed shadcn Card with a title, a line of help and an optional action. */
export function EmptyState({ title, body, action }: { title: string; body?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card className="items-center gap-2 border-dashed border-ink/20 px-6 py-10 text-center shadow-none">
      <CardTitle className="font-(family-name:--m-display) text-lg font-bold">{title}</CardTitle>
      {body && <CardDescription className="max-w-md">{body}</CardDescription>}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}
