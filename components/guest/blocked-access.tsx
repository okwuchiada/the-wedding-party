import { GEO_BYPASS_PARAM } from "@/lib/geo-param";

/** Shown to guests outside the countries the couple allowed, with a field for their access code. */
export default function BlockedAccess({ names, codeRejected }: { names: string | null; codeRejected: boolean }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory p-6 text-foreground">
      <div className="flex w-full max-w-md flex-col gap-5 text-center">
        {names && <p className="font-(family-name:--script) text-4xl text-burnt-orange">{names}</p>}
        <h1 className="font-(family-name:--serif) text-2xl">This site is only open in some countries</h1>
        <p className="text-base text-foreground/75">If the couple sent you an access code, enter it here.</p>
        <form method="GET" className="flex flex-col gap-3 text-left">
          <div>
            <label htmlFor="access-code" className="guest-label">
              Access code
            </label>
            <input
              id="access-code"
              type="text"
              name={GEO_BYPASS_PARAM}
              autoComplete="off"
              required
              aria-invalid={codeRejected ? true : undefined}
              aria-describedby={codeRejected ? "access-code-error" : undefined}
              className="guest-input"
            />
          </div>
          {codeRejected && (
            <p id="access-code-error" role="alert" className="text-[15px] text-burnt-orange-dark">
              That code didn&apos;t work. Check it and try again, or ask the couple for it.
            </p>
          )}
          <button type="submit" className="guest-btn w-full">
            Open the site
          </button>
        </form>
      </div>
    </main>
  );
}
