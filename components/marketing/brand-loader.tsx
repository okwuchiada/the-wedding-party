import { BRAND_CLASS, BRAND_STYLE, WOVEN } from "./brand";

/** Platform loading screen: the woven mark, its threads rising in turn like a loom. */
export default function BrandLoader() {
  return (
    <div
      role="status"
      style={BRAND_STYLE}
      className={`${BRAND_CLASS} flex min-h-screen flex-col items-center justify-center gap-5 px-4`}
    >
      <span aria-hidden className="flex h-14 items-end gap-1.5">
        {[...WOVEN, WOVEN[0]].map((c, i) => (
          <span
            key={i}
            style={{ background: `var(${c})`, animationDelay: `${i * 120}ms` }}
            className="loom-thread block h-full w-2.5 rounded-[3px]"
          />
        ))}
      </span>
      <p className="text-sm font-medium text-(--m-ink)/70">Loading…</p>
    </div>
  );
}
