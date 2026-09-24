import { GEO_BYPASS_PARAM } from "@/lib/geo";

export default function BlockedAccess({ codeRejected }: { codeRejected: boolean }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory p-6 text-center text-foreground">
      <div className="max-w-lg font-(family-name:--serif)">
        <p className="text-lg leading-relaxed">
          This site is currently unavailable in your country. If you have an access code, please
          enter it below.
        </p>
        <form method="GET" className="mt-5 flex justify-center gap-2">
          <input
            type="text"
            name={GEO_BYPASS_PARAM}
            placeholder="Access code"
            autoComplete="off"
            required
            className="border border-olive/40 bg-white px-3 py-2.5 text-base"
          />
          <button type="submit" className="bg-foreground px-4 py-2.5 text-base text-ivory">
            Enter
          </button>
        </form>
        {codeRejected && (
          <p className="mt-3 text-sm text-burnt-orange-dark">
            That code didn&apos;t work. Please try again or reach out to the couple directly.
          </p>
        )}
      </div>
    </main>
  );
}
