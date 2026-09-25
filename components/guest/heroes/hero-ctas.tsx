/** RSVP and registry buttons, shown only for sections the couple has switched on. */
export default function HeroCtas({
  showRsvp,
  showRegistry,
  tone = "default",
  align = "start",
}: {
  showRsvp: boolean;
  showRegistry: boolean;
  /** "inverse" for light buttons on a coloured or photo background. */
  tone?: "default" | "inverse";
  align?: "start" | "center";
}) {
  if (!showRsvp && !showRegistry) return null;
  const primary =
    tone === "inverse"
      ? "bg-ivory text-foreground hover:bg-cream"
      : "bg-olive text-ivory hover:bg-burnt-orange";
  const secondary =
    tone === "inverse"
      ? "border border-ivory/70 text-ivory hover:bg-ivory/10"
      : "border border-olive text-foreground hover:border-burnt-orange hover:text-burnt-orange";
  return (
    <div className={`flex flex-wrap gap-3 ${align === "center" ? "justify-center" : ""}`}>
      {showRsvp && (
        <a href="#rsvp" className={`px-6 py-3 text-sm font-medium transition-colors ${primary}`}>
          RSVP Now
        </a>
      )}
      {showRegistry && (
        <a href="#registry" className={`px-6 py-3 text-sm font-medium transition-colors ${secondary}`}>
          View Registry
        </a>
      )}
    </div>
  );
}
