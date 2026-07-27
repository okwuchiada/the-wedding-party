"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type StoryItem = { src: string; alt: string; note: string };

const FADE_DURATION = 350;

export default function StoryCarousel({ items }: { items: StoryItem[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);

  const indexRef = useRef(index);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const goTo = (i: number) => {
    const target = (i + items.length) % items.length;
    if (target === indexRef.current) return;
    setVisible(false);
    clearTimeout(fadeTimeoutRef.current);
    fadeTimeoutRef.current = setTimeout(() => {
      setIndex(target);
      setVisible(true);
    }, FADE_DURATION);
  };
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  useEffect(() => () => clearTimeout(fadeTimeoutRef.current), []);

  useEffect(() => {
    if (paused) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const id = setInterval(() => {
      goTo(indexRef.current + 1);
    }, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, items.length]);

  const current = items[index];

  return (
    <div
      className="mx-auto w-full max-w-2xl lg:w-auto lg:min-w-xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous photo"
          className="hidden lg:flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-olive/30 text-foreground transition-colors hover:border-burnt-orange hover:text-burnt-orange"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-4 w-4"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="relative w-full overflow-hidden bg-white p-3 pb-0 shadow-[0_18px_40px_-20px_rgba(58,46,40,0.45)]">
          <div
            className={`relative aspect-4/3 w-full overflow-hidden bg-olive/10 transition-opacity duration-350 ease-out ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={current.src}
              alt={current.alt}
              fill
              sizes="(min-width: 768px) 672px, 100vw"
              className="object-contain"
              priority={index === 0}
              loading="eager"
            />
          </div>
          <p
            className={`px-4 pt-5 pb-6 text-center font-(family-name:--serif) text-lg italic text-foreground transition-opacity duration-350 ease-out ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          >
            {current.note}
          </p>
        </div>

        <button
          type="button"
          onClick={next}
          aria-label="Next photo"
          className="hidden lg:flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-olive/30 text-foreground transition-colors hover:border-burnt-orange hover:text-burnt-orange"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-4 w-4"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {items.map((item, i) => (
          <button
            key={item.src}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to photo ${i + 1}`}
            aria-current={i === index}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === index ? "bg-burnt-orange" : "bg-olive/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
