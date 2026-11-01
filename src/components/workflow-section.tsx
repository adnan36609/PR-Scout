"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { ScrollStage, StageHeader } from "@/components/scroll-stage";

const STEPS = [
  {
    n: "01",
    title: "Connect a repository",
    body: "Sign in with GitHub and select a repository that you want PR Scout to review.",
  },
  {
    n: "02",
    title: "Start a pull-request review",
    body: "Choose a pull request and start a review, or let a configured webhook trigger one.",
  },
  {
    n: "03",
    title: "Inspect the results",
    body: "Explore findings, severity classifications, file locations, and the overall risk score.",
  },
];

type Tone = "ok" | "warn" | "bad" | "muted";
const TONE: Record<Tone, string> = {
  ok: "text-emerald-400",
  warn: "text-amber-400",
  bad: "text-red-400",
  muted: "text-muted-foreground",
};

function Row({
  left,
  right,
  tone = "muted",
}: {
  left: string;
  right: string;
  tone?: Tone;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 dark:bg-black/40 px-3 py-2.5">
      <span>{left}</span>
      <span className={TONE[tone]}>{right}</span>
    </div>
  );
}

function Visual({ step }: { step: number }) {
  if (step === 0)
    return (
      <>
        <Row left="adnan36609/PR-Scout" right="● Connected" tone="ok" />
        <Row
          left="adnan36609/pr-scout-playground"
          right="● Connected"
          tone="ok"
        />
        <Row left="adnan36609/Price-Pilot" right="+ Add" />
      </>
    );
  if (step === 1)
    return (
      <>
        <Row left="#42 Add webhook route" right="Processing" tone="warn" />
        <Row left="#41 Fix auth redirect" right="Completed" tone="ok" />
        <Row left="#40 Update README" right="Completed" tone="ok" />
        <p className="pt-2 text-xs text-muted-foreground">
          Triggered by webhook · pull_request event
        </p>
      </>
    );
  return (
    <>
      <Row left="route.ts:42" right="High" tone="bad" />
      <Row left="calculator.js:18" right="Medium" tone="warn" />
      <div className="rounded-lg border border-border bg-muted/50 dark:bg-black/40 px-3 py-3">
        <div className="mb-2 flex justify-between">
          <span>Risk score</span>
          <span className="text-amber-400">60/100</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full bg-amber-400"
            initial={{ width: 0 }}
            animate={{ width: "60%" }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </div>
      </div>
    </>
  );
}

export function WorkflowSection() {
  return (
    <section id="workflow" className="scroll-mt-20">
      <ScrollStage count={STEPS.length}>
        {({ active, progress }) => (
          <div>
            <StageHeader
              eyebrow="How it works"
              title="From GitHub pull request to clear findings."
              description="A straightforward review flow that keeps you in control of what gets analyzed and what happens next."
            />
            <div className="hidden lg:block mb-10 h-px bg-muted">
              <motion.div
                style={{ scaleX: progress }}
                className="h-px origin-left bg-emerald-400"
              />
            </div>

            <div className="grid gap-10 lg:grid-cols-2">
              <ol className="space-y-5">
                {STEPS.map((s, i) => (
                  <li
                    key={s.n}
                    className={cn(
                      "rounded-xl border p-6 transition-all duration-300",
                      i === active
                        ? "border-emerald-400/30 bg-white/4 opacity-100"
                        : "border-transparent lg:opacity-40",
                    )}
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {s.n}
                    </span>
                    <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {s.body}
                    </p>
                  </li>
                ))}
              </ol>

              <div className="hidden lg:block rounded-2xl border border-border bg-card/70 p-6">
                <div className="mb-6 flex gap-1.5">
                  <span className="size-2.5 rounded-full bg-muted-foreground/30" />
                  <span className="size-2.5 rounded-full bg-muted-foreground/30" />
                  <span className="size-2.5 rounded-full bg-muted-foreground/30" />
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="min-h-55 space-y-2 font-mono text-sm"
                  >
                    <Visual step={active} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </ScrollStage>
    </section>
  );
}
