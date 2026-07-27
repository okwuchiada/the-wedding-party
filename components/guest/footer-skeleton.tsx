import { Pulse } from "@/components/skeleton";

export default function FooterSkeleton() {
  return (
    <footer className="bg-foreground px-4 py-16 text-center sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Pulse tone="dark" className="mx-auto h-10 w-64" />
        <Pulse tone="dark" className="mx-auto mt-3.5 h-2.5 w-52" />
        <div className="mx-auto my-7 h-px w-10 bg-ivory/25" />
        <Pulse tone="dark" className="mx-auto h-2.5 w-72" />
      </div>
    </footer>
  );
}
