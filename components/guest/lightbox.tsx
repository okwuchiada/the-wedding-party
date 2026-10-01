"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { canOptimizeImage } from "@/lib/image-src";

export type LightboxItem = { id: string; url: string; type: "PHOTO" | "VIDEO"; guestName: string };

const SWIPE_PX = 50;

/**
 * The photo wall grid. Tapping a tile opens it full screen; swipe, arrow keys or
 * the buttons move between items, and Escape or Close returns to the tile.
 * The open item is tracked by id, because the wall refreshes while guests look:
 * new photos shift positions, and a photo the couple hides disappears.
 */
export default function Lightbox({ items }: { items: LightboxItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const tileRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipeStart = useRef<number | null>(null);

  const index = openId === null ? -1 : items.findIndex((m) => m.id === openId);
  const item = index === -1 ? null : items[index];
  const isOpen = item !== null;

  const close = useCallback(() => {
    setOpenId((current) => {
      if (current !== null) setTimeout(() => tileRefs.current[current]?.focus(), 0);
      return null;
    });
  }, []);

  const step = useCallback(
    (by: number) => {
      if (index === -1 || items.length === 0) return;
      setOpenId(items[(index + by + items.length) % items.length].id);
    },
    [index, items]
  );

  // The photo was hidden or removed while open: close instead of showing nothing
  // (adjusted during render, so the scroll lock below is released straight away).
  if (openId !== null && index === -1) setOpenId(null);

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close();
      // Leave arrows to a focused video's own controls.
      const inVideo = document.activeElement instanceof HTMLVideoElement;
      if (e.key === "ArrowRight" && !inVideo) step(1);
      if (e.key === "ArrowLeft" && !inVideo) step(-1);
      if (e.key === "Tab" && dialogRef.current) {
        // Keep focus inside the viewer.
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>("button, video[controls]");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close, step]);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {items.map((m) => (
          <li key={m.id}>
            <button
              ref={(el) => {
                tileRefs.current[m.id] = el;
              }}
              type="button"
              onClick={() => setOpenId(m.id)}
              aria-label={`Open ${m.type === "VIDEO" ? "video" : "photo"} from ${m.guestName}`}
              className="relative block aspect-square w-full overflow-hidden bg-olive/10"
            >
              {m.type === "VIDEO" ? (
                <>
                  <video src={m.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid size-11 place-items-center rounded-full bg-black/55 text-white">
                      <Play aria-hidden size={20} />
                    </span>
                  </span>
                </>
              ) : (
                <Image src={m.url} unoptimized={!canOptimizeImage(m.url)} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className="object-cover" />
              )}
            </button>
          </li>
        ))}
      </ul>

      {item && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${item.type === "VIDEO" ? "Video" : "Photo"} ${index + 1} of ${items.length}, from ${item.guestName}`}
          className="fixed inset-0 z-overlay flex flex-col bg-black/95 text-white"
        >
          <div className="flex items-center justify-between px-4 py-3 text-[15px]">
            <span className="tabular-nums">
              {index + 1} of {items.length}
            </span>
            <button ref={closeRef} type="button" onClick={close} aria-label="Close" className="grid size-11 place-items-center">
              <X aria-hidden size={24} />
            </button>
          </div>
          {/* Swipes are read on the photo only, so a video's scrubber and pinch-zoom don't page. */}
          <div
            className="relative min-h-0 flex-1"
            onPointerDown={(e) => {
              swipeStart.current = e.isPrimary && item.type === "PHOTO" ? e.clientX : null;
            }}
            onPointerUp={(e) => {
              if (swipeStart.current === null || !e.isPrimary) return;
              const dx = e.clientX - swipeStart.current;
              swipeStart.current = null;
              if (Math.abs(dx) > SWIPE_PX) step(dx < 0 ? 1 : -1);
            }}
            onPointerCancel={() => (swipeStart.current = null)}
          >
            {item.type === "VIDEO" ? (
              <video key={item.id} src={item.url} controls playsInline className="h-full w-full object-contain" />
            ) : (
              <Image key={item.id} src={item.url} unoptimized={!canOptimizeImage(item.url)} alt={`Photo from ${item.guestName}`} fill sizes="100vw" className="object-contain" />
            )}
          </div>
          <div className="flex items-center justify-between px-2 py-3">
            <button type="button" onClick={() => step(-1)} aria-label="Previous" className="grid size-11 place-items-center">
              <ChevronLeft aria-hidden size={28} />
            </button>
            <span className="text-[15px]">From {item.guestName}</span>
            <button type="button" onClick={() => step(1)} aria-label="Next" className="grid size-11 place-items-center">
              <ChevronRight aria-hidden size={28} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
