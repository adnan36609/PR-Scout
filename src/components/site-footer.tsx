import Link from "next/link";
import { GitPullRequest } from "lucide-react";
import { LandingTopLink } from "@/components/landing-top-link";
import { GitHubMark } from "@/components/github-mark";

const links = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "How it works" },
  { href: "#reliability", label: "Under the hood" },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent"
      />

      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          {/* Brand */}
          <div className="max-w-xs">
            <LandingTopLink
              className="group flex items-center gap-2 font-semibold text-foreground transition-opacity hover:opacity-80"
              aria-label="PR Scout back to top"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground motion-reduce:transform-none">
                <GitPullRequest className="size-4" />
              </span>
              <span>PR Scout</span>
            </LandingTopLink>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              AI-assisted pull-request reviews with structured findings,
              severity labels, and a clear risk score.
            </p>
          </div>

          {/* Page links */}
          <nav aria-label="Footer">
            <p className="text-sm font-semibold text-foreground">Explore</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-block transition-all duration-300 hover:translate-x-1 hover:text-foreground motion-reduce:transform-none"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Project */}
          <div>
            <p className="text-sm font-semibold text-foreground">Project</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              PR Scout is open source. Browse the code or follow along on
              GitHub.
            </p>
            <Link
              href="https://github.com/adnan36609/PR-Scout"
              target="_blank"
              rel="noreferrer"
              className="group/btn mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground hover:shadow-md motion-reduce:transform-none"
            >
              <GitHubMark className="size-4 transition-transform duration-300 group-hover/btn:rotate-12 group-hover/btn:scale-110 motion-reduce:transform-none" />
              View on GitHub
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PR Scout. All rights reserved.</p>
          <p>AI-assisted pull-request reviews.</p>
        </div>
      </div>
    </footer>
  );
}