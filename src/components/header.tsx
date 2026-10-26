"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FolderGit2, GitPullRequest, Icon, ScanSearch } from "lucide-react";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "./theme-toggle";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null | undefined;
}

interface HeaderProps {
  user: User;
}

const navItems = [
  {
    href: "/repos",
    label: "Repositories",
    icon: FolderGit2,
  },
  {
    href: "/reviews",
    label: "Reviews",
    icon: GitPullRequest,
  },
];

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="h-5 w-px bg-border mx-1 hidden sm:block" />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}