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
  Clock,
  Plus,
  Minus,
  FileText,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  GitBranch,
  Globe,
  Lock,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function RepositoryDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [prState, setPrState] = useState<"open" | "closed" | "all">("open");

  const repository = trpc.repository.list.useQuery(undefined, {
    select: (repos) => repos.find((r) => r.id === id),
  });

  const pullRequests = trpc.pullRequest.list.useQuery(
    { repositoryId: id, state: prState },
    { enabled: !!id },
  );

  const prCounts = {
    open: pullRequests.data?.filter((pr) => pr.state === "open").length ?? 0,
    closed:
      pullRequests.data?.filter((pr) => pr.state === "closed").length ?? 0,
    all: pullRequests.data?.length ?? 0,
  };

  if (repository.isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="size-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!repository.data) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <GitBranch className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 font-medium">Repository not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            This repository may have been disconnected.
          </p>
          <Link href="/repos" className="mt-6 inline-block">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Back to repositories
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href={"/repos"}>
            <Button variant={"outline"} size={"icon"} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {repository.data.fullName}
              </h1>
              <Badge variant={"outline"} className="gap-1">
                {repository.data.private ? (
                  <>
                    <Lock className="size-3" />
                    Private
                  </>
                ) : (
                  <>
                    <Globe className="size-3" />
                    Public
                  </>
                )}
              </Badge>
            </div>
            <a
              href={repository.data.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 mt-1"
            >
              View on GitHub
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
        <Button
          variant={"ghost"}
          size={"icon-sm"}
          onClick={() => pullRequests.refetch()}
          disabled={pullRequests.isFetching}
        >
          <RefreshCw
            className={cn("size-4", pullRequests.isFetching && "animate-spin")}
          />
        </Button>
      </div>

      <div className="border-b border-border/60">
        <div className="flex items-center gap-1">
          {(["open", "closed", "all"] as const).map((state) => (
            <button
              key={state}
              onClick={() => setPrState(state)}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium transition-colors",
                prState === state
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-2">
                {state === "open" && (
                  <GitPullRequest className="size-4 text-emerald-500" />
                )}
                {state === "closed" && (
                  <GitMerge className="size-4 text-purple-500" />
                )}
                {state === "all" && (
                  <GitBranch className="size-4 text-muted-foreground" />
                )}
                {state.charAt(0).toUpperCase() + state.slice(1)}
                <span
                  className={cn(
                    "px-1.5 py-0.5 text-xs rounded-md tabular-nums",
                    prState === state
                      ? "bg-foreground/10 text-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {prCounts[state]}
                </span>
              </span>
              {prState === state && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {pullRequests.isLoading ? (
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))
        ) : pullRequests.error ? (
          <Card className="border-destructive/50">
            <CardContent className="py-12 text-center">
              <div className="mx-auto size-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="size-6 text-destructive" />
              </div>
              <p className="mt-4 font-medium text-destructive">
                Failed to load pull requests.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {pullRequests.error.message}
              </p>
            </CardContent>
          </Card>
        ) : pullRequests.data?.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center">
                <GitPullRequest className="size-6 text-muted-foreground" />
              </div>
              <p className="mt-4 font-medium">No pull requests found.</p>
              <p className="text-sm text-muted-foreground mt-1">
                {prState === "all"
                  ? "This repository has no pull requests yet."
                  : `No ${prState} pull requests found.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          pullRequests.data?.map((pr) => (
            <PullRequestCard key={pr.id} pr={pr} repositoryId={id} />
          ))
        )}
      </div>
    </div>
  );
}

interface PullRequestCardProps {
  pr: {
    id: number;
    number: number;
    title: string;
    state: "open" | "closed";
    draft: boolean;
    htmlUrl: string;
    author: { login: string; avatarUrl: string };
    headRef: string;
    baseRef: string;
    additions: number;
    deletions: number;
    changedFiles: number;
    createdAt: string;
    mergedAt: string | null;
    review: { status: string; createdAt: Date } | null;
  };
  repositoryId: string;
}

function PullRequestCard({ pr, repositoryId }: PullRequestCardProps) {
  const isMerged = pr.state === "closed" && pr.mergedAt !== null;

  return (
    <Card className="group hover:border-border transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div>
              {isMerged ? (
                <GitMerge className="size-4 text-purple-500" />
              ) : pr.state === "closed" ? (
                <XCircle className="size-4 text-red-500" />
              ) : (
                <GitPullRequest className="size-4 text-emerald-500" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <Link
                  href={`/repos/${repositoryId}/pr/${pr.number}`}
                  className="font-medium hover:text-primary transition-colors line-clamp-1"
                >
                  {pr.title}
                </Link>
                {pr.draft && (
                  <Badge variant={"secondary"} className="text-xs">
                    Draft
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="font-mono text-xs">#{pr.number}</span>
                <span className="text-muted-foreground/40">•</span>
                <span className="flex items-center gap-1.5">
                  <Avatar className="size-4 ring-1 ring-border">
                    <AvatarImage
                      src={pr.author.avatarUrl}
                      alt={pr.author.login}
                    />
                    <AvatarFallback className="text-[10px]">
                      {pr.author.login?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  {pr.author.login}
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {formatDate(pr.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <code className="px-2 py-0.5 rounded-md bg-muted text-xs font-mono text-muted-foreground flex items-center truncate">
                  {pr.baseRef}
                  <ArrowLeft className="mx-1.5 size-3 text-muted-foreground/50" />
                  {pr.headRef}
                </code>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Plus className="size-3" />
                    <span>{pr.additions}</span>
                  </span>
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <Minus className="size-3" />
                    <span>{pr.deletions}</span>
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <FileText className="size-3" />
                    <span>{pr.changedFiles}</span>
                    files
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {pr.review && <ReviewStatusBadge status={pr.review.status} />}
            <Link href={`/repos/${repositoryId}/pr/${pr.number}`}>
              <Button variant={pr.review ? "outline" : "default"}>
                {pr.review ? "View" : "Review"}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewStatusBadge({ status }: { status: string }) {
  const config = {
    COMPLETED: {
      icon: CheckCircle,
      label: "Reviewed",
      className:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    PROCESSING: {
      icon: Loader2,
      label: "Analyzing",
      className:
        "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      spin: true,
    },
    PENDING: {
      icon: Clock,
      label: "Queued",
      className:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    },
    FAILED: {
      icon: XCircle,
      label: "Failed",
      className:
        "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    },
  }[status] ?? {
    icon: Clock,
    label: "Pending",
    className: "bg-muted text-muted-foreground",
  };

  const Icon = config.icon;

  return (
    <Badge className={config.className}>
      <Icon className={cn("size-3", config.spin && "animate-spin")} />
      {config.label}
    </Badge>
  );
}