"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FolderGit2,
  GitPullRequest,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const overview = trpc.dashboard.overview.useQuery();

  const firstName = session?.user?.name?.trim().split(/\s+/)[0] || "there";

  if (overview.isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>

        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (overview.error || !overview.data) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="py-12 text-center">
          <h1 className="text-lg font-semibold">
            Unable to load your dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {overview.error?.message || "Please try again."}
          </p>

          <button
            type="button"
            onClick={() => overview.refetch()}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        </CardContent>
      </Card>
    );
  }

  const {
    repositoryCount,
    totalReviews,
    completedReviews,
    activeReviews,
    recentReviews,
  } = overview.data;

  const metrics = [
    {
      label: "Connected repositories",
      value: repositoryCount,
      description: "Repositories linked to your account",
      icon: FolderGit2,
      iconClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      href: "/repos",
    },
    {
      label: "Total reviews",
      value: totalReviews,
      description: "Reviews recorded in PR Scout",
      icon: GitPullRequest,
      iconClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      href: "/reviews",
    },
    {
      label: "Completed reviews",
      value: completedReviews,
      description: "Reviews finished successfully",
      icon: CheckCircle2,
      iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      href: "/reviews?status=COMPLETED",
    },
    {
      label: "Active reviews",
      value: activeReviews,
      description: "Pending or currently processing",
      icon: Clock3,
      iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      href: "/reviews?status=active",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">PR Scout overview</p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Welcome back, {firstName}.
          </h1>

          <p className="mt-2 text-muted-foreground">
            Here&apos;s what&apos;s happening across your repositories and code
            reviews.
          </p>
        </div>

        <Link
          href="/repos"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <FolderGit2 className="size-4" />
          Manage repositories
        </Link>
      </section>

      <section
        aria-label="Review statistics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <Link
              key={metric.label}
              href={metric.href}
              aria-label={`${metric.label}: ${metric.value}. View details.`}
              className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Card className="h-full border-border/70 transition-all duration-200 group-hover:border-primary/40 group-hover:bg-muted/30 group-hover:shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">
                        {metric.label}
                      </p>

                      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
                        {metric.value}
                      </p>
                    </div>

                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg",
                        metric.iconClass,
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Recent activity
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your latest pull-request reviews.
            </p>
          </div>

          <Link
            href="/reviews"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            View all reviews
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <Card className="overflow-hidden border-border/70">
          {recentReviews.length === 0 ? (
            <CardContent className="flex flex-col items-center py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <GitPullRequest className="size-6 text-muted-foreground" />
              </div>

              <h3 className="mt-4 font-medium">No reviews yet</h3>

              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Connect a repository and start an AI review to see your activity
                here.
              </p>

              <Link
                href="/repos"
                className="mt-5 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Connect a repository
                <ArrowRight className="size-4" />
              </Link>
            </CardContent>
          ) : (
            <div className="divide-y divide-border/60">
              {recentReviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/repos/${review.repository.id}/pr/${review.prNumber}`}
                  className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
                        getStatusIconBackground(review.status),
                      )}
                    >
                      <GitPullRequest className="size-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-medium">{review.prTitle}</p>

                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {review.repository.fullName} · #{review.prNumber}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 pl-12 sm:pl-0">
                    {review.status === "COMPLETED" &&
                      review.riskScore !== null && (
                        <span className="text-sm text-muted-foreground">
                          Risk{" "}
                          <span className="font-semibold text-foreground">
                            {review.riskScore}/100
                          </span>
                        </span>
                      )}

                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                        getStatusBadgeClass(review.status),
                      )}
                    >
                      {formatStatus(review.status)}
                    </span>

                    <ArrowRight className="hidden size-4 text-muted-foreground sm:block" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}

function formatStatus(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "Completed";
    case "PROCESSING":
      return "Processing";
    case "PENDING":
      return "Pending";
    case "FAILED":
      return "Failed";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

function getStatusIconBackground(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "PROCESSING":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "PENDING":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "FAILED":
      return "bg-red-500/10 text-red-600 dark:text-red-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    case "PROCESSING":
      return "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400";
    case "PENDING":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400";
    case "FAILED":
      return "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400";
    case "CANCELLED":
      return "border-border bg-muted text-muted-foreground";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
