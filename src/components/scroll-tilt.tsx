"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

export function ScrollTilt({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });
  const rotateX = useTransform(scrollYProgress, [0, 1], [16, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.93, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0.4, 1]);

  return (
    <div ref={ref} style={{ perspective: 1200 }}>
      <motion.div style={{ rotateX, scale, opacity, transformOrigin: "top center" }}>
        {children}
      </motion.div>
    </div>
  );
}