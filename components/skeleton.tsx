export function Pulse({
  className = "",
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const bg = tone === "dark" ? "bg-ivory/15" : "bg-olive/10";
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse motion-reduce:animate-none ${bg} ${className}`}
    />
  );
}
