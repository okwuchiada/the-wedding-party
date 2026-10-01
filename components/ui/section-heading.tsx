export function SectionHeading({
  title,
  description,
  action,
  as: Tag = "h2",
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <Tag className={`font-(family-name:--m-display) font-bold tracking-tight text-ink ${Tag === "h2" ? "text-2xl" : "text-lg"}`}>{title}</Tag>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}
