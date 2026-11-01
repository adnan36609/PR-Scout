import Link from "next/link";
import { Check } from "lucide-react";
import { HeroPreview } from "@/components/hero-preview";
import { GitHubMark } from "@/components/github-mark";
import { PrimaryAction } from "@/components/primary-action";
import { ScrollTilt } from "@/components/scroll-tilt";

const checklist = [
  "Findings, severity and risk score in one place",
  "Start reviews manually or from GitHub webhooks",
  "Cancel reviews that are pending or processing",
];

export function HeroSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section
      id="top"
      className="relative isolate grid items-stretch gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14"
    >
      {/* Background: faint grid + soft glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-4 -top-10 bottom-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 text-foreground/6 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-size-[48px_48px] mask-[radial-gradient(ellipse_at_40%_25%,black,transparent_70%)]" />
        <div className="absolute left-1/3 top-0 size-120 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="flex max-w-2xl flex-col justify-center lg:pb-6 lg:pl-6">
        <h1 className="text-[clamp(2.25rem,3.8vw,3.6rem)] font-semibold leading-[1.12] tracking-tight">
          <span className="block">Understand your</span>
          <span className="block">pull requests</span>
          <span className="block bg-linear-to-b from-foreground to-foreground/50 bg-clip-text text-transparent">
            before you merge.
          </span>
        </h1>

        <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          PR Scout analyzes GitHub pull requests and presents structured
          findings, severity classifications, and risk scores, so you can focus
          on the changes that deserve attention.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <PrimaryAction isAuthenticated={isAuthenticated}>
            {isAuthenticated ? "Open Dashboard" : "Get started"}
          </PrimaryAction>
          <Link
            href="https://github.com/adnan36609/PR-Scout"
            target="_blank"
            rel="noreferrer"
            className="group/btn inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground hover:shadow-md motion-reduce:transform-none"
          >
            <GitHubMark className="size-4 transition-transform duration-300 group-hover/btn:rotate-12 group-hover/btn:scale-110 motion-reduce:transform-none" />
            View on GitHub
          </Link>
        </div>

        <ul className="mt-10 space-y-3.5 text-base text-muted-foreground">
          {checklist.map((item) => (
            <li key={item} className="flex items-center gap-2.5">
              <Check className="size-4 shrink-0 text-emerald-500" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <ScrollTilt>
        <HeroPreview />
      </ScrollTilt>
    </section>
  );
}
