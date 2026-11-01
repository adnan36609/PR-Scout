import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SpotlightCard } from "@/components/spotlight-card";
import { GitHubMark } from "@/components/github-mark";

export function CtaSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section>
      <SpotlightCard className="rounded-3xl p-8 sm:p-12">
        <div
          aria-hidden
          className="cta-glow pointer-events-none absolute -top-24 left-1/2 -ml-72 h-48 w-xl rounded-full bg-emerald-500/20 blur-3xl"
        />
        <div className="relative flex flex-col items-center text-center">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Take a closer look at your next pull request.
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Connect a GitHub repository and explore structured AI-assisted review
            findings in PR Scout.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href={isAuthenticated ? "/dashboard" : "/sign-in"}
              className="group inline-flex h-11 items-center gap-2 rounded-lg bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90"
            >
              {isAuthenticated ? "Open Dashboard" : "Get started with GitHub"}
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <a
              href="https://github.com/adnan36609/PR-Scout"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-5 text-sm font-medium transition hover:bg-muted"
            >
              <GitHubMark className="size-4" />
              Source code
            </a>
          </div>

          <p className="mt-6 font-mono text-xs text-muted-foreground">
            Open source · Sign in with GitHub
          </p>
        </div>
      </SpotlightCard>
    </section>
  );
}