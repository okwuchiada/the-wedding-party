import { Pulse } from "@/components/skeleton";

export default function OurStorySkeleton() {
  return (
    <div className="mx-auto mt-14 flex max-w-6xl flex-col items-start gap-12 lg:flex-row">
      <div className="mx-auto w-full max-w-2xl lg:w-auto lg:min-w-xl">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 shrink-0" />
          <div className="w-full bg-white p-3 pb-0 shadow-[0_18px_40px_-20px_rgba(58,46,40,0.45)]">
            <Pulse className="aspect-4/3 w-full" />
            <div className="px-4 pt-5 pb-6">
              <Pulse className="mx-auto h-3 w-2/3" />
            </div>
          </div>
          <div className="h-10 w-10 shrink-0" />
        </div>
        <div className="mt-6 flex justify-center gap-2">
          <Pulse className="h-2 w-2" />
          <Pulse className="h-2 w-2" />
          <Pulse className="h-2 w-2" />
        </div>
      </div>

      <div className="w-80 shrink-0">
        <Pulse className="mx-auto h-10 w-10" />
        <div className="mx-auto mt-6 h-0.5 w-10 bg-olive/20" />
        <Pulse className="mx-auto mt-6 h-3 w-full" />
        <Pulse className="mx-auto mt-2 h-3 w-5/6" />
        <Pulse className="mx-auto mt-2 h-3 w-2/3" />
        <Pulse className="mx-auto mt-5 h-2.5 w-32" />
      </div>
    </div>
  );
}
