"use client";

import { useEffect, useRef, useState } from "react";
import { GitPullRequest, RotateCcw } from "lucide-react";

const code = [
  { n: 82, sign: " ", text: "const res = await charge(order);" },
  { n: 83, sign: "+", text: "const data = await res.json();" },
  { n: 84, sign: "+", text: "order.status = data.status;", flagged: true },
  { n: 85, sign: "+", text: "return finalize(order);" },
  { n: 86, sign: " ", text: "}" },
];

const findings = [
  {
    title: "Unchecked payment response",
    sev: "High",
    file: "src/payments/checkout.ts:84",
    dot: "bg-red-500",
    badge: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  {
    title: "Missing retry guard",
    sev: "Medium",
    file: "src/payments/retry.ts:42",
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    title: "Loose response type",
    sev: "Low",
    file: "src/payments/types.ts:12",
    dot: "bg-sky-500",
    badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
];

const scoreByPhase = [0, 40, 58, 72];

function useCountUp(target: number, ms = 900) {
  const [value, setValue] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / ms, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(a + (target - a) * eased);
      from.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);

  return value;
}

export function HeroPreview() {
  const [phase, setPhase] = useState(0); // 0 scanning, 1-3 findings revealed
  const [started, setStarted] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const timers = reduce
    ? [
        setTimeout(() => {
          setStarted(true);
          setPhase(3);
        }, 0),
      ]
    : [
        setTimeout(() => setStarted(true), 60),
        setTimeout(() => setPhase(1), 1800),
        setTimeout(() => setPhase(2), 2700),
        setTimeout(() => setPhase(3), 3600),
      ];

  return () => timers.forEach(clearTimeout);
}, [cycle]);

  const score = useCountUp(scoreByPhase[phase]);
  const done = phase === 3;

  const barColor =
    score >= 70 ? "bg-red-500" : score >= 50 ? "bg-amber-500" : "bg-primary";

  const counters = [
    { label: "High", value: phase >= 1 ? 1 : 0, color: "text-red-500" },
    { label: "Medium", value: phase >= 2 ? 1 : 0, color: "text-amber-500" },
    { label: "Low", value: phase >= 3 ? 1 : 0, color: "text-sky-500" },
  ];

  return (
    <div className="min-w-0 rounded-xl bg-linear-to-b from-border via-border to-transparent p-px shadow-2xl shadow-black/10 dark:shadow-black/40">
      <div className="overflow-hidden rounded-[11px] bg-card">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-muted">
              <GitPullRequest className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Handle payment response</p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                sample-org/checkout-service · #128
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
            <span
              className={`size-1.5 rounded-full transition-colors duration-500 ${
                done ? "bg-emerald-500" : "animate-pulse bg-primary"
              }`}
            />
            {done ? "Review complete" : "Analyzing…"}
          </span>
        </div>

        <div className="space-y-4 p-5">
          {/* Diff with scan line */}
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <div className="border-b border-border px-3 py-2 font-mono text-[11px] text-muted-foreground">
              src/payments/checkout.ts
            </div>
            <div className="relative overflow-hidden py-1 font-mono text-xs leading-6">
              {code.map((line) => {
                const flagged = line.flagged && phase >= 1;
                return (
                  <div
                    key={line.n}
                    className={`flex gap-3 border-l-2 px-3 transition-colors duration-500 ${
                      flagged
                        ? "border-red-500 bg-red-500/10"
                        : line.sign === "+"
                          ? "border-emerald-500/50 bg-emerald-500/5"
                          : "border-transparent"
                    }`}
                  >
                    <span className="w-5 shrink-0 select-none text-right text-muted-foreground">
                      {line.n}
                    </span>
                    <span className="w-2 shrink-0 select-none text-muted-foreground">
                      {line.sign}
                    </span>
                    <span className="truncate">{line.text}</span>
                  </div>
                );
              })}

              <div
                aria-hidden
                className={`pointer-events-none absolute inset-x-0 h-10 -translate-y-full border-b border-primary/50 bg-linear-to-b from-transparent to-primary/20 ${
                  started
                    ? "transition-[top,opacity] duration-1700 ease-linear"
                    : ""
                } ${phase === 0 ? "opacity-100" : "opacity-0"}`}
                style={{ top: started ? "100%" : "0%" }}
              />
            </div>
          </div>

          {/* Score + counters */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            <div className="col-span-3 rounded-lg border border-border bg-background p-3 sm:col-span-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Risk score
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {score}
                <span className="text-sm font-normal text-muted-foreground">
                  /100
                </span>
              </p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            {counters.map((c) => (
              <div
                key={c.label}
                className="rounded-lg border border-border bg-background p-3"
              >
                <p
                  className={`text-2xl font-semibold tabular-nums transition-colors duration-500 ${
                    c.value ? c.color : "text-muted-foreground/40"
                  }`}
                >
                  {c.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Findings */}
          <ul className="space-y-2">
            {findings.map((f, i) => (
              <li
                key={f.title}
                className={`flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-all duration-500 ease-out motion-reduce:transition-none ${
                  phase > i
                    ? "translate-y-0 opacity-100"
                    : "translate-y-2 opacity-0"
                }`}
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <span className={`size-2 shrink-0 rounded-full ${f.dot}`} />
                    <span className="truncate">{f.title}</span>
                  </p>
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                    {f.file}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${f.badge}`}
                >
                  {f.sev}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
          <span>Illustrative preview · example data</span>
          <button
            onClick={() => {
  setPhase(0);
  setStarted(false);
  setCycle((c) => c + 1);
}}
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-all duration-300 hover:bg-muted hover:text-foreground ${
              done ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <RotateCcw className="size-3" /> Replay
          </button>
        </div>
      </div>
    </div>
  );
}