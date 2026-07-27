export default function PageLoader() {
  return (
    <div
      role="status"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center"
    >
      <span
        aria-hidden="true"
        className="font-(family-name:--serif) text-5xl italic text-burnt-orange motion-safe:animate-pulse sm:text-6xl"
      >
        &amp;
      </span>
      <p className="text-xs uppercase tracking-[0.3em] text-olive">Loading</p>
    </div>
  );
}
