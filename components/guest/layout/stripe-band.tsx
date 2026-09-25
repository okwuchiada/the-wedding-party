// A band of aso-oke-style stripes in the wedding's own colours (Owambe template).
const STRIPES = ["--burnt-orange", "--olive", "--cream", "--burnt-orange-dark", "--olive-dark", "--burnt-orange", "--ivory", "--olive"];

export default function StripeBand({ className = "h-3" }: { className?: string }) {
  return (
    <div aria-hidden className={`flex ${className}`}>
      {STRIPES.map((v, i) => (
        <span key={i} style={{ background: `var(${v})`, flexGrow: i % 3 === 0 ? 3 : i % 2 ? 1 : 2 }} />
      ))}
    </div>
  );
}
