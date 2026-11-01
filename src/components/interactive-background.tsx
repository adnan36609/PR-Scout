"use client";

import { useEffect, useRef } from "react";

const GRID = "56px 56px";
const line = (c: string) =>
  `linear-gradient(to right, ${c} 1px, transparent 1px), linear-gradient(to bottom, ${c} 1px, transparent 1px)`;

export function InteractiveBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 3;
    let x = tx;
    let y = ty;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const tick = () => {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ "--mx": "50%", "--my": "30%" } as React.CSSProperties}
    >
      {/* faint base grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: line(
            "color-mix(in oklab, var(--foreground) 7%, transparent)",
          ),
          backgroundSize: GRID,
          maskImage:
            "radial-gradient(ellipse at 50% 0%, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 0%, black 30%, transparent 75%)",
        }}
      />
      {/* emerald grid revealed around the cursor */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: line("rgba(52,211,153,0.35)"),
          backgroundSize: GRID,
          maskImage:
            "radial-gradient(240px circle at var(--mx) var(--my), black, transparent)",
          WebkitMaskImage:
            "radial-gradient(240px circle at var(--mx) var(--my), black, transparent)",
        }}
      />
      {/* soft glow following the cursor */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(520px circle at var(--mx) var(--my), rgba(16,185,129,0.10), transparent 60%)",
        }}
      />
    </div>
  );
}
