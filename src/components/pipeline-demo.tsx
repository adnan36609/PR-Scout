"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Play, RotateCcw, Square, X } from "lucide-react";

const stages = [
  {
    name: "Webhook",
    heading: "Review request received",
    text: "A pull-request event arrives from a configured GitHub webhook, or you start a review manually.",
    log: "pull_request event received",
  },
  {
    name: "Dedupe",
    heading: "Webhook deduplication",
    text: "Delivery IDs help prevent the same webhook delivery from creating duplicate review work.",
    log: "delivery ID not seen before, accepted",
  },
  {
    name: "Inngest job",
    heading: "Asynchronous processing",
    text: "Inngest processes review jobs outside the initial request-response cycle.",
    log: "review job queued and started",
  },
  {
    name: "AI review",
    heading: "Commit snapshot checks",
    text: "Base and head commit checks help identify pull requests that changed during a review.",
    log: "base and head commits match, analyzing diff",
  },
  {
    name: "Findings",
    heading: "Structured findings",
    text: "Findings, severity labels, file locations and the overall risk score are ready to inspect.",
    log: "findings saved, risk score calculated",
  },
];

type Status = "idle" | "running" | "done" | "cancelled";

const STEP_MS = 1300;

export function PipelineDemo() {
  const [status, setStatus] = useState<Status>("idle");
  const [step, setStep] = useState(-1);
  const [selected, setSelected] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const last = stages.length - 1;

  function run() {
    setStep(0);
    setSelected(0);
    setStatus("running");
  }

  // advance one stage at a time
  useEffect(() => {
    if (status !== "running") return;
    const t = setTimeout(() => {
      if (step >= last) {
        setStatus("done");
      } else {
        setStep(step + 1);
        setSelected(step + 1);
      }
    }, STEP_MS);
    return () => clearTimeout(t);
  }, [status, step, last]);

  // autoplay once when scrolled into view
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStep(0);
          setSelected(0);
          setStatus("running");
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function stateOf(i: number): "idle" | "active" | "done" | "cancelled" {
    if (status === "done") return "done";
    if (status === "idle" || i > step) return "idle";
    if (i < step) return "done";
    return status === "cancelled" ? "cancelled" : "active";
  }

  const fill = status === "done" ? 100 : step <= 0 ? 0 : (step / last) * 100;

  const nodeStyles = {
    idle: "border-border bg-background text-muted-foreground",
    active: "border-primary bg-primary/10 text-primary",
    done: "border-primary bg-primary text-primary-foreground",
    cancelled:
      "border-red-500/60 bg-red-500/10 text-red-600 dark:text-red-400",
  };

  const statusLabel = {
    idle: "Ready",
    running: "Processing",
    done: "Complete",
    cancelled: "Cancelled",
  }[status];

  const dotStyle = {
    idle: "bg-muted-foreground/50",
    running: "bg-primary animate-pulse",
    done: "bg-emerald-500",
    cancelled: "bg-red-500",
  }[status];

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span
            className={`size-1.5 rounded-full transition-colors duration-500 ${dotStyle}`}
          />
          Simulated review run · {statusLabel}
        </div>

        {status === "running" ? (
          <button
            onClick={() => setStatus("cancelled")}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-red-500/40 px-3 text-xs font-medium text-red-600 shadow-sm transition-colors hover:bg-red-500/10 dark:text-red-400"
          >
            <Square className="size-3" /> Cancel review
          </button>
        ) : (
          <button
            onClick={run}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {status === "idle" ? (
              <Play className="size-3" />
            ) : (
              <RotateCcw className="size-3" />
            )}
            {status === "idle" ? "Run demo" : "Replay"}
          </button>
        )}
      </div>

      {/* Stage track */}
      <div className="px-5 py-6">
        <div className="relative grid grid-cols-5">
          <div className="absolute left-[10%] right-[10%] top-3.5 h-px bg-border">
            <div
              className="h-full bg-primary transition-all duration-700 ease-out motion-reduce:transition-none"
              style={{ width: `${fill}%` }}
            />
          </div>

          {stages.map((stage, i) => {
            const state = stateOf(i);
            return (
              <button
                key={stage.name}
                onClick={() => setSelected(i)}
                aria-pressed={selected === i}
                className="group relative z-10 flex flex-col items-center gap-2 rounded-md text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={`relative flex size-7 items-center justify-center rounded-full border font-mono text-xs transition-all duration-500 group-hover:scale-110 motion-reduce:transition-none ${nodeStyles[state]}`}
                >
                  {state === "active" && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary/30 motion-reduce:hidden" />
                  )}
                  {state === "done" ? (
                    <Check className="size-3.5" />
                  ) : state === "cancelled" ? (
                    <X className="size-3.5" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={`text-[11px] transition-colors duration-300 sm:text-xs ${
                    selected === i
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {stage.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail + log */}
      <div className="grid divide-y divide-border border-t border-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        {/* Stage detail: all panels stacked, cross-fade between them */}
        <div className="grid p-6">
          {stages.map((stage, i) => (
            <div
              key={stage.name}
              aria-hidden={selected !== i}
              className={`col-start-1 row-start-1 transition-all duration-500 ease-out motion-reduce:transition-none ${
                selected === i
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-2 opacity-0"
              }`}
            >
              <p className="font-mono text-xs text-muted-foreground">
                {String(i + 1).padStart(2, "0")} · {stage.name}
              </p>
              <h3 className="mt-3 text-lg font-semibold">{stage.heading}</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                {stage.text}
              </p>
            </div>
          ))}
        </div>

        {/* Live log */}
        <div className="bg-background/50 p-6 font-mono text-xs">
          <ul className="space-y-2.5">
            {stages.map((stage, i) => {
              const visible = status === "done" || step >= i;
              return (
                <li
                  key={stage.name}
                  className={`flex gap-3 transition-all duration-500 motion-reduce:transition-none ${
                    visible
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-2 opacity-0"
                  }`}
                >
                  <span className="text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{stage.log}</span>
                </li>
              );
            })}
            <li
              className={`flex gap-3 text-red-600 transition-all duration-500 dark:text-red-400 motion-reduce:transition-none ${
                status === "cancelled"
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-2 opacity-0"
              }`}
            >
              <span>!!</span>
              <span>review cancelled</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer note */}
      <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          Cancellation controls:
        </span>{" "}
        pending and processing reviews can be cancelled from the application.
      </div>
    </div>
  );
}