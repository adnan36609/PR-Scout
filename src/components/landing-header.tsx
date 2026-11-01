import Link from "next/link";
import { GitPullRequest } from "lucide-react";
import { LandingTopLink } from "@/components/landing-top-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { PrimaryAction } from "@/components/primary-action";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "How it works" },
  { href: "#reliability", label: "Reliability" },
];

export function LandingHeader({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <LandingTopLink
            className="flex shrink-0 items-center gap-2 text-base font-bold tracking-tight text-foreground transition-opacity hover:opacity-80"
            aria-label="PR Scout home"
          >
            <GitPullRequest className="size-5" />
            <span>PR Scout</span>
          </LandingTopLink>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Landing page navigation"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="scroll-mt-16 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
          {isAuthenticated ? (
            <PrimaryAction isAuthenticated compact>
              <span className="hidden sm:inline">Open </span>Dashboard
            </PrimaryAction>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Sign in
              </Link>
              <PrimaryAction isAuthenticated={false}>Get started</PrimaryAction>
            </>
          )}
        </div>
      </div>
    </header>
  );
}