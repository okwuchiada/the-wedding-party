import Image from "next/image";

export default function Polaroid({
  src,
  alt,
  caption,
  rotate = 0,
  width,
  height,
  className,
}: {
  src: string;
  alt: string;
  caption: string;
  rotate?: number;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <figure
      style={{ ["--r" as string]: `${rotate}deg`, width } as React.CSSProperties}
      className={`rotate-(--r) bg-white pt-3 px-3 pb-0 shadow-[0_18px_40px_-20px_rgba(58,46,40,0.45)] transition-transform duration-400 ease-[cubic-bezier(.2,.7,.2,1)] hover:rotate-[calc(var(--r)/2)] hover:scale-[1.03] ${className ?? ""}`}
    >
      <div style={{ height }} className="relative overflow-hidden bg-olive/10">
        <Image src={src} alt={alt} fill sizes={`${width}px`} className="object-cover" loading="eager" />
      </div>
      <figcaption className="pt-3 px-1 pb-4 text-center font-(family-name:--serif) text-lg italic text-foreground">
        {caption}
      </figcaption>
    </figure>
  );
}
