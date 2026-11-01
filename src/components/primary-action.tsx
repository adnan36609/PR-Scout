import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function PrimaryAction({
  isAuthenticated,
  children,
  compact = false,
}: {
  isAuthenticated: boolean;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <Link
      href={isAuthenticated ? "/dashboard" : "/sign-up"}
      className={`inline-flex ${compact ? "h-9" : "h-10"} items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90`}
    >
      {children}
      <ArrowUpRight className="size-4" />
    </Link>
  );
}