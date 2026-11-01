"use client";

import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

export function HoverTilt({
  children,
  max = 6,
}: {
  children: React.ReactNode;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 150, damping: 20 });
  const sy = useSpring(py, { stiffness: 150, damping: 20 });

  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const gx = useTransform(sx, [0, 1], ["0%", "100%"]);
  const gy = useTransform(sy, [0, 1], ["0%", "100%"]);
  const glow = useMotionTemplate`radial-gradient(380px circle at ${gx} ${gy}, rgba(16,185,129,0.14), transparent 60%)`;

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ perspective: 1200 }}
    >
      <motion.div style={{ rotateX, rotateY }} className="relative">
        {children}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ background: glow }}
        />
      </motion.div>
    </div>
  );
}