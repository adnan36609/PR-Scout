"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useScroll, type MotionValue } from "motion/react";

export function ScrollStage({
  count,
  vhPerStep = 55,
  children,
}: {
  count: number;
  vhPerStep?: number;
  children: (s: {
    active: number;
    progress: MotionValue<number>;
  }) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setDesktop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // the section unpins slightly before progress hits 1, so stretch the range
    const i = Math.min(count - 1, Math.max(0, Math.floor((v / 0.85) * count)));
    setActive((p) => (p === i ? p : i));
  });

  return (
    <div
      ref={ref}
      className="lg:h-(--stage-h)"
      style={
        { "--stage-h": `${70 + count * vhPerStep}vh` } as React.CSSProperties
      }
    >
      <div className="lg:sticky lg:top-20 lg:flex lg:min-h-[calc(100svh-5rem)] lg:flex-col lg:justify-start lg:pt-[3vh]">
        {children({
          active: desktop ? active : count - 1,
          progress: scrollYProgress,
        })}
      </div>
    </div>
  );
}

export function StageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-2 max-w-4xl text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h2>
      </div>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
