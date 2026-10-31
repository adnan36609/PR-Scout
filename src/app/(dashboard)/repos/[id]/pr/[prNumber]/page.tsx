"use client";

import { use, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  GitPullRequest,
  GitMerge,
  ExternalLink,
  Clock,
  Plus,
  Minus,
  FileText,
  XCircle,
  CheckCircle,
  Loader2,
  GitBranch,
  ArrowRight,
  Wand2,
  ScanSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DiffViewer } from "@/components/diff-viewer";
import { ReviewResult } from "@/components/review-result";

type PageProps = {
  params: Promise<{ id: string; prNumber: string }>;
};

export default function PullRequestDetailPage({ params }: PageProps) {
  const { id, prNumber } = use(params);
  const prNum = parseInt(prNumber, 10);
  const [activeTab, setActiveTab] = useState<"review" | "files">("review");

  const pr = trpc.pullRequest.get.useQuery(
    { repositoryId: id, prNumber: prNum },
    { enabled: !isNaN(prNum) },
  );

  const files = trpc.pullRequest.files.useQuery(
    { repositoryId: id, prNumber: prNum },
    { enabled: !isNaN(prNum) },
  );

  const latestReview = trpc.review.getLatestForPR.useQuery(
    { repositoryId: id, prNumber: prNum },
    {
      enabled: !isNaN(prNum),
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === "PENDING" || status === "PROCESSING") {
          return 2000;
        }
        return false;
      },
    },
  );

  const triggerReview = trpc.review.trigger.useMutation({
    onSuccess: () => {
      latestReview.refetch();
      pr.refetch();
    },
  });

  const cancelReview = trpc.review.cancel.useMutation({
    onSuccess: async () => {
      await latestReview.refetch();
      await pr.refetch();
    },
  });

  const isReviewing =
    latestReview.data?.status === "PENDING" ||
    latestReview.data?.status === "PROCESSING";

  if (pr.isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-96" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (pr.error || !pr.data) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="mx-auto size-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="size-6 text-destructive" />
          </div>
          <p className="mt-4 font-medium text-destructive">
            {pr.error?.message ?? "Pull Request not found"}
          </p>
          <Link href={`/repos/${id}`} className="mt-6 inline-block">
            <Button variant={"outline"}>
              <ArrowLeft className="size-4" />
              Back to Repository
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isMerged = pr.data.state === "closed" && pr.data.mergedAt;

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <Link href={`/repos/${id}`}>
          <Button variant={"outline"} size={"icon"} className="shrink-0 mt-1">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <div
                  className={cn(
                    "p-2 rounded-lg shrink-0",
                    isMerged
                      ? "bg-purple-500/10"
                      : pr.data.state === "closed"
                        ? "bg-red-500/10"
                        : "bg-emerald-500/10",
                  )}
                >
                  {isMerged ? (
                    <GitMerge className="size-5 text-purple-500" />
                  ) : pr.data.state === "closed" ? (
                    <XCircle className="size-5 text-red-500" />
                  ) : (
                    <GitPullRequest className="size-5 text-emerald-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-semibold tracking-tight truncate">
                    {pr.data.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <PRStatusBadge
                      state={pr.data.state}
                      isMerged={!!isMerged}
                      draft={pr.data.draft}
                    />
                    <span className="text-sm text-muted-foreground font-mono">
                      #{pr.data.number}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <a
              href={pr.data.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button variant={"outline"} size={"sm"} className="gap-2">
                <ExternalLink className="size-4" />
                GitHub
              </Button>
            </a>
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-2">
              <Avatar className="h-5 w-5 ring-1 ring-border">
                <AvatarImage src={pr.data.author.avatarUrl} />
                <AvatarFallback className="text-[10px]">
                  {pr.data.author.login?.[0]?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">
                {pr.data.author.login}
              </span>
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
            </span>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center divide-x divide-border/60">
            <div className="flex-1 min-w-0 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <GitBranch className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1">
                    Branch comparison
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <code className="px-2 py-0.5 rounded bg-secondary font-mono text-xs min-w-0 truncate">
                      {pr.data.headRef}
                    </code>
                    <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                    <code className="px-2 py-0.5 rounded bg-secondary font-mono text-xs min-w-0 truncate">
                      {pr.data.baseRef}
                    </code>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-6 px-6 py-4">
              <StatItem
                icon={Plus}
                value={pr.data.additions}
                colorClass="text-emerald-600 dark:text-emerald-400"
                bgClass="bg-emerald-500/10"
              />
              <StatItem
                icon={Minus}
                value={pr.data.deletions}
                colorClass="text-red-600 dark:text-red-400"
                bgClass="bg-red-500/10"
              />
              <StatItem
                icon={FileText}
                value={pr.data.changedFiles}
                colorClass="text-muted-foreground dark:text-muted-foreground"
                bgClass="bg-muted"
              />
            </div>

            <div className="px-6 py-4 flex shrink-0 items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg px-3 py-1.5">
                <ReviewStatusBadge
                  status={latestReview.data?.status ?? null}
                  completedAt={
                    latestReview.data?.status === "COMPLETED"
                      ? latestReview.data.createdAt
                      : null
                  }
                />

                <div className="h-4 w-px bg-border" />

                {isReviewing ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const reviewId = latestReview.data?.id;

                      if (reviewId) {
                        cancelReview.mutate({ id: reviewId });
                      }
                    }}
                    disabled={cancelReview.isPending || !latestReview.data?.id}
                    className="gap-1.5 h-auto py-1 px-2 text-xs"
                  >
                    <XCircle className="size-3.5" />
                    {cancelReview.isPending ? "Stopping..." : "Stop review"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      triggerReview.mutate({
                        repositoryId: id,
                        prNumber: prNum,
                      });
                    }}
                    disabled={triggerReview.isPending}
                    className="gap-1.5 h-auto py-1 px-2 text-xs"
                  >
                    <Wand2 className="size-3.5" />
                    {latestReview.data ? "Re-run" : "Review"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-border/60">
        <div className="flex items-center gap-1">
          <TabButton
            active={activeTab === "review"}
            onClick={() => setActiveTab("review")}
            icon={ScanSearch}
            label="Reviews"
            count={
              latestReview.data?.status === "COMPLETED"
                ? Array.isArray(latestReview.data.comments)
                  ? latestReview.data.comments.length
                  : 0
                : 0
            }
          />

          <TabButton
            active={activeTab === "files"}
            onClick={() => setActiveTab("files")}
            icon={FileText}
            label="Changed Files"
            count={files.data?.length}
          />
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "review" && (
        <div>
          {latestReview.data ? (
            <ReviewResult review={latestReview.data} />
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="mx-auto size-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <ScanSearch className="size-7 text-primary" />
                </div>
                <p className="mt-4 font-medium">No reviews yet.</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  Click &quot;Run AI Review&quot; to analyze this pull request
                  for bugs, security issues, and improvements.
                </p>
                <Button
                  className="mt-6"
                  onClick={() =>
                    triggerReview.mutate({ repositoryId: id, prNumber: prNum })
                  }
                  disabled={triggerReview.isPending}
                >
                  Run AI Review
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "files" && (
        <div>
          {files.isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : files.error ? (
            <Card className="border-destructive/50">
              <CardContent className="py-12 text-center">
                <div className="mx-auto size-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="size-6 text-destructive" />
                </div>
                <p className="mt-4 font-medium text-destructive">
                  No files changed.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {files.error.message}
                </p>
              </CardContent>
            </Card>
          ) : files.data ? (
            <DiffViewer files={files.data} />
          ) : null}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "px-1.5 py-0.5 text-xs rounded-md tabular-nums",
            active
              ? "bg-foreground/10 text-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
      )}
    </button>
  );
}

function StatItem({
  icon: Icon,
  value,
  label,
  colorClass,
  bgClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label?: string;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("p-1.5 rounded-md", bgClass)}>
        <Icon className={cn("size-3.5", colorClass)} />
      </div>
      <div>
        <p className={cn("text-sm font-semibold tabular-nums", colorClass)}>
          {value.toLocaleString()}
        </p>
        {label && (
          <p className={cn("text-xs font-medium", colorClass)}>{label}</p>
        )}
      </div>
    </div>
  );
}

function PRStatusBadge({
  state,
  isMerged,
  draft,
}: {
  state: string;
  isMerged: boolean;
  draft: boolean;
}) {
  if (draft) {
    return (
      <Badge variant={"secondary"} className="gap-1">
        Draft
      </Badge>
    );
  }

  if (isMerged) {
    return (
      <Badge
        variant={"secondary"}
        className="bg-purple-600/10 dark:text-purple-400 border-purple-500/20 border"
      >
        <GitMerge className="size-3" />
        Merged
      </Badge>
    );
  }

  if (state === "closed") {
    return (
      <Badge variant={"destructive"} className="gap-1">
        <XCircle className="size-3" />
        Closed
      </Badge>
    );
  }

  if (state === "open") {
    return (
      <Badge
        variant={"secondary"}
        className="gap-1 bg-emerald-600/10 dark:text-emerald-400 border-emerald-500/20 border"
      >
        <GitPullRequest className="size-3" />
        Open
      </Badge>
    );
  }
}

function ReviewStatusBadge({
  status,
  completedAt,
}: {
  status: string | null;
  completedAt?: Date | null;
}) {
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (!status) {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 border bg-muted text-muted-foreground"
      >
        <Clock className="h-3 w-3" />
        Not reviewed
      </Badge>
    );
  }

  const config = {
    COMPLETED: {
      icon: CheckCircle,
      label: completedAt
        ? `AI Review completed · ${getTimeAgo(completedAt)}`
        : "AI Review completed",
      className:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    PROCESSING: {
      icon: Loader2,
      label: "Analyzing code…",
      className:
        "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      spin: true,
    },
    PENDING: {
      icon: Clock,
      label: "Queued for review",
      className:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    FAILED: {
      icon: XCircle,
      label: "Review failed",
      className:
        "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    },
  }[status] ?? {
    icon: Clock,
    label: "Not reviewed",
    className: "bg-muted text-muted-foreground",
  };

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("gap-1.5 border", config.className)}>
      <Icon className={cn("h-3 w-3", config.spin && "animate-spin")} />
      {config.label}
    </Badge>
  );
}
