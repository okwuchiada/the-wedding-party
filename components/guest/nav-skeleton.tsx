import { Pulse } from "@/components/skeleton";

export default function NavSkeleton() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-baseline gap-10">
          <Pulse className="h-6.5 w-14" />
          <Pulse className="hidden h-2.5 w-24 sm:block" />
        </div>
        <div className="hidden items-center gap-6 sm:flex">
          <Pulse className="h-3 w-16" />
          <Pulse className="h-3 w-20" />
          <Pulse className="h-3 w-24" />
        </div>
      </div>
    </nav>
  );
}
