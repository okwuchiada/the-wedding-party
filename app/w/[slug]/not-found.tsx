import SiteHomeLink from "@/components/guest/site-home-link";

export default function GuestNotFound() {
  return (
    <main className="flex min-h-[70svh] flex-col items-center justify-center gap-5 px-6 text-center">
      <h1 className="font-(family-name:--serif) text-4xl text-foreground">This page isn&apos;t part of the site</h1>
      <p className="text-base text-foreground/75">It may have moved, or the link was mistyped.</p>
      <SiteHomeLink />
    </main>
  );
}
