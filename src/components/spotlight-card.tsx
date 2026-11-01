"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

export function SpotlightCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - r.left}px`);
    el.style.setProperty("--y", `${e.clientY - r.top}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card/70 transition-colors hover:border-emerald-400/30",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(360px circle at var(--x) var(--y), rgba(16,185,129,0.14), transparent 60%)",
        }}
      />
      <div className="relative flex h-full flex-col">{children}</div>
    </div>
  );
}