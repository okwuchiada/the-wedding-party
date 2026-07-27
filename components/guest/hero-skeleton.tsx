import { Pulse } from "@/components/skeleton";

export default function HeroSkeleton() {
  return (
    <header className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Pulse className="mb-5 h-3 w-40" />

          <Pulse className="h-14 w-64 sm:h-16 sm:w-80 lg:h-20 lg:w-96" />
          <Pulse className="mt-4 h-10 w-48 sm:h-12 sm:w-60 lg:h-14 lg:w-72" />

          <Pulse className="mt-6 h-4 w-full max-w-md" />
          <Pulse className="mt-2 h-4 w-3/4 max-w-md" />

          <div className="mt-8 mb-3 flex items-center gap-4">
            <Pulse className="h-8 w-48" />
            <div className="h-6 w-px bg-olive/30" />
            <Pulse className="h-4 w-20" />
          </div>
          <Pulse className="mb-8 h-3 w-56" />

          <Pulse className="mb-8 h-10 w-full max-w-md" />

          <div className="flex flex-wrap gap-3">
            <Pulse className="h-11 w-32" />
            <Pulse className="h-11 w-36" />
          </div>
        </div>

        <div className="relative hidden h-120 lg:block">
          <Pulse className="absolute top-0 left-[8%] h-[272px] w-[230px]" />
          <Pulse className="absolute top-17.5 right-[2%] h-[236px] w-[200px]" />
          <Pulse className="absolute -bottom-4 left-[26%] z-10 h-[186px] w-[236px]" />
        </div>
      </div>
    </header>
  );
}
