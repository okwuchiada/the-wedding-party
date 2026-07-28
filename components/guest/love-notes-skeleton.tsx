import { Pulse } from "@/components/skeleton";

function LoveNoteCardSkeleton() {
  return (
    <div className="border border-olive/15 bg-white p-8 pb-7 shadow-[0_20px_44px_-24px_rgba(58,46,40,0.4)]">
      <Pulse className="h-2.5 w-40" />
      <Pulse className="mt-5 h-4 w-full" />
      <Pulse className="mt-2 h-4 w-11/12" />
      <Pulse className="mt-2 h-4 w-3/4" />
      <Pulse className="mt-5 h-2.5 w-24" />
    </div>
  );
}

export default function LoveNotesSkeleton() {
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-10 sm:grid-cols-2">
      <LoveNoteCardSkeleton />
      <LoveNoteCardSkeleton />
    </div>
  );
}
