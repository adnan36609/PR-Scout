"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollStage, StageHeader } from "@/components/scroll-stage";

const STAGES = [
  {
    name: "Webhook",
    title: "Webhook received",
    body: "GitHub notifies PR Scout with a pull_request event.",
    log: "pull_request event received",
  },
  {
    name: "Dedupe",
    title: "Duplicate protection",
    body: "The delivery ID is checked so a repeated delivery doesn't start a second review.",
    log: "delivery ID not seen before, accepted",
  },
  {
    name: "Inngest job",
    title: "Background job",
    body: "The review is queued as an Inngest job, so the webhook can respond right away.",
    log: "review job queued and started",
  },
  {
    name: "AI review",
    title: "Diff analysis",
    body: "Base and head commits are verified, then the diff is analyzed.",
    log: "base and head commits match, analyzing diff",
  },
  {
    name: "Findings",
    title: "Structured findings",
    body: "Findings, severity labels, file locations and the overall risk score are ready to inspect.",
    log: "findings saved, risk score calculated",
  },
];

export function ReliabilitySection() {
  return (
    <section id="reliability" className="scroll-mt-20">
      <ScrollStage count={STAGES.length} vhPerStep={45}>
        {({ active }) => (
          <div>
            <StageHeader
              eyebrow="Under the hood"
              title="A review pipeline with lifecycle safeguards."
              description="PR Scout does more than send a prompt to an AI API. It manages review requests and their processing lifecycle."
            />

            <div className="overflow-hidden rounded-2xl border border-border bg-card/70">
              <div className="flex items-center gap-2 border-b border-border px-8 py-5 font-mono text-sm text-muted-foreground">
                <span className="size-2 rounded-full bg-emerald-400" />
                Simulated review run · stage {active + 1}/{STAGES.length} ·
                scroll to advance
              </div>

              {/* stepper */}
              <div className="relative border-b border-border py-9">
                <div className="absolute left-[10%] right-[10%] top-12.5 h-px bg-muted" />
                <div
                  className="absolute left-[10%] right-[10%] top-12.5 h-px origin-left bg-emerald-400 transition-transform duration-500"
                  style={{
                    transform: `scaleX(${active / (STAGES.length - 1)})`,
                  }}
                />
                <ol className="relative grid grid-cols-5">
                  {STAGES.map((s, i) => {
                    const done =
                      i < active || (i === active && i === STAGES.length - 1);
                    const current = i === active && !done;
                    return (
                      <li
                        key={s.name}
                        className="flex flex-col items-center gap-3 text-center"
                      >
                        <span
                          className={cn(
                            "grid size-7 place-items-center rounded-full border text-xs transition-all duration-300",
                            done
                              ? "border-emerald-400 bg-emerald-400 text-black"
                              : current
                                ? "border-emerald-400 bg-background text-emerald-400 ring-4 ring-emerald-400/20"
                                : "border-border bg-background text-muted-foreground",
                          )}
                        >
                          {done ? <Check className="size-3.5" /> : i + 1}
                        </span>
                        <span
                          className={cn(
                            "text-xs transition-colors sm:text-sm",
                            i <= active
                              ? "text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {s.name}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* detail + log */}
              <div className="grid divide-border lg:grid-cols-2 lg:divide-x">
                <div className="min-h-42.5 p-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={active}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className="font-mono text-xs text-muted-foreground">
                        {String(active + 1).padStart(2, "0")} ·{" "}
                        {STAGES[active].name}
                      </p>
                      <h3 className="mt-3 text-xl font-semibold">
                        {STAGES[active].title}
                      </h3>
                      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                        {STAGES[active].body}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <ul className="space-y-3.5 p-8 font-mono text-sm">
                  {STAGES.map((s, i) => (
                    <motion.li
                      key={s.log}
                      initial={false}
                      animate={{
                        opacity: i <= active ? 1 : 0.15,
                        x: i <= active ? 0 : -6,
                      }}
                      transition={{ duration: 0.3 }}
                      className="flex gap-3"
                    >
                      <span className="text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{s.log}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-border px-8 py-5 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  Cancellation controls:
                </span>{" "}
                pending and processing reviews can be cancelled from the
                application.
              </div>
            </div>
          </div>
        )}
      </ScrollStage>
    </section>
  );
}
