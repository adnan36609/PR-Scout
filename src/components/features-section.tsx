"use client";

import { History, Layers, ScanSearch, Workflow } from "lucide-react";
import { motion } from "motion/react";
import { Reveal } from "@/components/reveal";
import { SpotlightCard } from "@/components/spotlight-card";
import { StageHeader } from "@/components/scroll-stage";
import { cn } from "@/lib/utils";

const inView = {
  initial: { opacity: 0, x: -12 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true },
};

function FindingsVisual() {
  const rows = [
    { sev: "High", dot: "bg-orange-400", text: "text-orange-400", title: "multiply() is redefined to perform addition", file: "src/calculator.js:14" },
    { sev: "Low", dot: "bg-emerald-400", text: "text-emerald-400", title: "Unused variable 'result'", file: "src/calculator.js:22" },
  ];
  return (
    <div className="mt-6 space-y-2 font-mono text-xs">
      {rows.map((r, i) => (
        <motion.div
          key={r.file}
          {...inView}
          transition={{ duration: 0.4, delay: 0.3 + i * 0.12 }}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 dark:bg-black/40 px-3 py-2.5"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className={cn("size-1.5 shrink-0 rounded-full", r.dot)} />
            <span className="truncate">{r.title}</span>
          </span>
          <span className="flex shrink-0 items-center gap-3">
            <span className="hidden text-muted-foreground sm:inline">{r.file}</span>
            <span className={r.text}>{r.sev}</span>
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function RiskVisual() {
  return (
    <div className="rounded-lg border border-border bg-muted/50 dark:bg-black/40 p-3 font-mono text-xs">
      <div className="mb-2 flex justify-between">
        <span>Risk score</span>
        <span className="text-orange-400">60/100</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-orange-400"
          initial={{ width: 0 }}
          whileInView={{ width: "60%" }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.3 }}
        />
      </div>
      <div className="mt-3 flex gap-4 text-muted-foreground">
        <span><span className="text-orange-400">●</span> 1 High</span>
        <span><span className="text-amber-400">●</span> 0 Medium</span>
        <span><span className="text-emerald-400">●</span> 1 Low</span>
      </div>
    </div>
  );
}

function HistoryVisual() {
  const tabs = [
    { label: "All", n: 26, cls: "border-border bg-muted text-foreground" },
    { label: "Completed", n: 18, cls: "border-emerald-400/30 text-emerald-400" },
    { label: "Failed", n: 2, cls: "border-red-400/30 text-red-400" },
    { label: "Cancelled", n: 6, cls: "border-border text-muted-foreground" },
  ];
  return (
    <div className="space-y-2 font-mono text-xs">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t, i) => (
          <motion.span
            key={t.label}
            {...inView}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
            className={cn("rounded-full border px-3 py-1", t.cls)}
          >
            {t.label} {t.n}
          </motion.span>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 dark:bg-black/40 px-3 py-2">
        <span className="truncate">#2 test: add intentional multiplication bug</span>
        <span className="shrink-0 text-emerald-400">Completed</span>
      </div>
    </div>
  );
}

function WebhookVisual() {
  const lines = ["pull_request · opened", "delivery accepted", "review job queued"];
  return (
    <div className="mt-6 space-y-1.5 rounded-lg border border-border bg-muted/50 dark:bg-black/40 p-3 font-mono text-xs">
      {lines.map((l, i) => (
        <motion.div
          key={l}
          {...inView}
          transition={{ duration: 0.4, delay: 0.3 + i * 0.15 }}
          className="flex gap-2"
        >
          <span className="text-emerald-400">→</span>
          <span>{l}</span>
        </motion.div>
      ))}
    </div>
  );
}

const FEATURES = [
  {
    icon: ScanSearch,
    tint: "bg-blue-500/15 text-blue-400",
    title: "Structured review findings",
    body: "Actionable findings with explanations, severity labels, and file references in one place.",
    visual: <FindingsVisual />,
  },
  {
    icon: Layers,
    tint: "bg-violet-500/15 text-violet-400",
    title: "Severity and risk at a glance",
    body: "A severity classification and risk score show which changes deserve a closer look.",
    visual: <RiskVisual />,
  },
  {
    icon: Workflow,
    tint: "bg-cyan-500/15 text-cyan-400",
    title: "GitHub-connected workflow",
    body: "Connect repositories and start reviews manually or through configured GitHub webhook events.",
    visual: <WebhookVisual />,
  },
  {
    icon: History,
    tint: "bg-emerald-500/15 text-emerald-400",
    title: "Review history and controls",
    body: "Filter every review by status, open the pull request on GitHub, and cancel or delete what you no longer need.",
    visual: <HistoryVisual />,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20">
      <Reveal>
        <StageHeader
          eyebrow="Product capabilities"
          title="Review changes with more context."
          description="Keep findings, severity, and review status together instead of losing useful context in a long stream of generated text."
        />
      </Reveal>

      <div className="grid gap-4 md:grid-cols-2">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.08} className="h-full">
            <SpotlightCard className="h-full p-5">
              <div className="flex items-center gap-3">
                <div className={cn("grid size-9 shrink-0 place-items-center rounded-lg", f.tint)}>
                  <f.icon className="size-4" />
                </div>
                <h3 className="text-base font-semibold sm:text-lg">{f.title}</h3>
              </div>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
              <div className="mt-auto pt-4">{f.visual}</div>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}