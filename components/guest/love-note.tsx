"use client";

import { useEffect, useState } from "react";

type Note = { text: string; caption: string };

export default function LoveNote({ notes }: { notes: Note[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (notes.length < 2) return;
    let fadeTimeout: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      setVisible(false);
      fadeTimeout = setTimeout(() => {
        setIndex((i) => (i + 1) % notes.length);
        setVisible(true);
      }, 400);
    }, 30_000);
    return () => {
      clearInterval(id);
      clearTimeout(fadeTimeout);
    };
  }, [notes.length]);

  if (notes.length === 0) return null;

  const note = notes[index];
  const accent = index === 0 ? "text-burnt-orange" : "text-olive";
  const divider = index === 0 ? "bg-burnt-orange" : "bg-olive";

  return (
    <div className="w-80 shrink-0">
      <div
        className={`text-center transition-opacity duration-400 ${visible ? "opacity-100" : "opacity-0"}`}
      >
        <span
          className={`font-(family-name:--serif) text-6xl leading-none opacity-30 ${accent}`}
        >
          &ldquo;
        </span>
        <div className={`mx-auto mt-2 h-0.5 w-10 ${divider}`} />
        <p className="mt-6 font-(family-name:--serif) text-lg leading-relaxed text-foreground italic">
          {note.text}
        </p>
        <span
          className={`font-(family-name:--serif) text-6xl leading-none opacity-30 ${accent}`}
        >
          &rdquo;
        </span>
        <div className={`mx-auto mt-2 h-0.5 w-10 ${divider}`} />
        <p className="mt-5 text-xs uppercase tracking-[0.2em] text-foreground/60">
          {note.caption}
        </p>
      </div>
    </div>
  );
}
