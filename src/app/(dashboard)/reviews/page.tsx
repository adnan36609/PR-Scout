"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GitPullRequest,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  FileText,
  ExternalLink,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type ReviewStatus =
  | "all"
  | "active"
  | "COMPLETED"
  | "PROCESSING"
  | "PENDING"
  | "FAILED"
  | "CANCELLED";

function parseReviewStatus(status: string | null): ReviewStatus {
  switch (status) {
    case "active":
    case "COMPLETED":
    case "PROCESSING":
    case "PENDING":
    case "FAILED":
    case "CANCELLED":
      return status;

    default:
      return "all";
  }
}

export default function ReviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      }
    >
      <ReviewsPageContent />
    </Suspense>
  );
}

function ReviewsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const statusFilter = parseReviewStatus(searchParams.get("status"));

  const setStatusFilter = (status: ReviewStatus) => {
    const params = new URLSearchParams(searchParams.toString());

    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }

    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const reviews = trpc.review.list.useQuery(
    { limit: 50 },
    {
      refetchInterval: (query) => {
        const hasProcessing = query.state.data?.some(
          (r) => r.status === "PENDING" || r.status === "PROCESSING",
        );
        return hasProcessing ? 3000 : false;
      },
    },
  );

  const triggerReview = trpc.review.trigger.useMutation({
    onSuccess: () => {
      reviews.refetch();
    },
  });

  const deleteReview = trpc.review.delete.useMutation({
    onSuccess: () => {
      reviews.refetch();
    },
  });

  const cancelReview = trpc.review.cancel.useMutation({
    onSuccess: () => {
      reviews.refetch();
    },
  });

  const filteredReviews = reviews.data?.filter((review) => {
    if (statusFilter === "all") {
      return true;
    }

    if (statusFilter === "active") {
      return review.status === "PENDING" || review.status === "PROCESSING";
    }

    return review.status === statusFilter;
  });

  const statusCounts = {
    all: reviews.data?.length ?? 0,
    COMPLETED:
      reviews.data?.filter((r) => r.status === "COMPLETED").length ?? 0,
    PROCESSING:
      reviews.data?.filter((r) => r.status === "PROCESSING").length ?? 0,
    PENDING: reviews.data?.filter((r) => r.status === "PENDING").length ?? 0,
    FAILED: reviews.data?.filter((r) => r.status === "FAILED").length ?? 0,
    CANCELLED:
      reviews.data?.filter((r) => r.status === "CANCELLED").length ?? 0,
    active:
      (reviews.data?.filter((r) => r.status === "PENDING").length ?? 0) +
      (reviews.data?.filter((r) => r.status === "PROCESSING").length ?? 0),
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
          <p className="text-muted-foreground mt-1">
            {statusCounts.all} total reviews
          </p>
        </div>
        <Button
          variant={"ghost"}
          size={"icon-sm"}
          onClick={() => reviews.refetch()}
          disabled={reviews.isFetching}
        >
          <RefreshCw
            className={cn("size-4", reviews.isFetching && "animate-spin")}
          />
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap p-1 bg-muted/50 rounded-lg w-fit">
        {(
          [
            "all",
            "active",
            "COMPLETED",
            "PROCESSING",
            "PENDING",
            "FAILED",
            "CANCELLED",
          ] as const
        ).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              statusFilter === status
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <StatusIcon
              status={status}
              className="size-3.5"
              spin={statusCounts[status] > 0}
            />
            {status === "all"
              ? "All"
              : status === "active"
                ? "Active"
                : status.charAt(0) + status.slice(1).toLowerCase()}
            <span
              className={cn(
                "ml-1 text-xs tabular-nums",
                statusFilter === status
                  ? "text-muted-foreground"
                  : "text-muted-foreground/70",
              )}
            >
              {statusCounts[status]}
            </span>
          </button>
        ))}
      </div>

      {reviews.isLoading ? (
        <div>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : reviews.error ? (
        <Card className="border-destructive/50">
          <CardContent className="py-8 text-center">
            <p className="text-destructive">{reviews.error.message}</p>
          </CardContent>
        </Card>
      ) : filteredReviews?.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-4 font-medium">
              {statusFilter === "all"
                ? "No reviews yet"
                : `No ${statusFilter.toLowerCase()} reviews`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {statusFilter === "all" &&
                "Run your first AI review on a pull request!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReviews?.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onRetry={
                review.status === "FAILED"
                  ? () =>
                      triggerReview.mutate({
                        repositoryId: review.repository.id,
                        prNumber: review.prNumber,
                      })
                  : undefined
              }
              onDelete={() => deleteReview.mutate({ id: review.id })}
              isDeleting={
                deleteReview.isPending &&
                deleteReview.variables?.id === review.id
              }
              onCancel={
                review.status === "PENDING" || review.status === "PROCESSING"
                  ? () => cancelReview.mutate({ id: review.id })
                  : undefined
              }
              isCancelling={
                cancelReview.isPending &&
                cancelReview.variables?.id === review.id
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ReviewCardProps {
  review: {
    id: string;
    prNumber: number;
    prTitle: string;
    prUrl: string;
    status: string;
    summary: string | null;
    riskScore: number | null;
    comments: unknown;
    error: string | null;
    createdAt: Date;
    repository: {
      id: string;
      fullName: string;
    };
  };
  onRetry?: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  onCancel?: () => void;
  isCancelling: boolean;
}

function ReviewCard({
  review,
  onRetry,
  onDelete,
  isDeleting,
  onCancel,
  isCancelling,
}: ReviewCardProps) {
  const commentCount = Array.isArray(review.comments)
    ? review.comments.length
    : 0;

  const getStatusMessage = () => {
    switch (review.status) {
      case "PENDING":
        return "Queued - will start shortly";
      case "PROCESSING":
        return "Analyzing code...";
      case "FAILED":
        return review.error || "Analysis failed";
      case "CANCELLED":
        return "Review cancelled";
      default:
        return null;
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <Card className="group hover:border-border transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div
              className={cn(
                "mt-1 p-2 rounded-lg shrink-0",
                getStatusBg(review.status),
              )}
            >
              <StatusIcon status={review.status} className="size-4" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/repos/${review.repository.id}/pr/${review.prNumber}`}
                  className="font-medium hover:text-primary transition-colors truncate"
                >
                  {review.prTitle}
                </Link>
                <StatusBadge status={review.status} />
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="font-medium">
                  {review.repository.fullName}
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span>#{review.prNumber}</span>
                <span className="text-muted-foreground/50">•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(review.createdAt)}
                </span>
              </div>
              {review.status === "COMPLETED" && (
                <div className="flex items-center gap-4 pt-1">
                  {review.riskScore !== null && (
                    <RiskScoreBadge score={review.riskScore} />
                  )}
                  {commentCount > 0 && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <AlertTriangle className="size-3.5" />
                      {commentCount}{" "}
                      {commentCount === 1 ? "comment" : "comments"}
                    </span>
                  )}
                </div>
              )}
              {review.summary && review.status === "COMPLETED" && (
                <p className="text-sm text-muted-foreground line-clamp-2 pt-1">
                  {review.summary}
                </p>
              )}
              {statusMessage && review.status !== "COMPLETED" && (
                <p
                  className={cn(
                    "text-sm pt-1",
                    review.status === "FAILED"
                      ? "text-red-600 dark:text-red-400"
                      : "text-muted-foreground",
                  )}
                >
                  {statusMessage}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={review.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
            >
              <ExternalLink className="size-4" />
            </a>
            {onCancel && (
              <Button
                size="sm"
                variant="outline"
                onClick={onCancel}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Cancel"
                )}
              </Button>
            )}
            {review.status === "FAILED" && onRetry ? (
              <Button onClick={onRetry}>Retry</Button>
            ) : (
              <Link
                href={`/repos/${review.repository.id}/pr/${review.prNumber}`}
              >
                <Button size={"sm"} variant={"outline"}>
                  {review.status === "COMPLETED"
                    ? "Completed"
                    : review.status === "CANCELLED"
                      ? "Cancelled"
                      : review.status === "PROCESSING"
                        ? "In progress"
                        : "Pending"}
                </Button>
              </Link>
            )}
            {["COMPLETED", "FAILED", "CANCELLED"].includes(review.status) && (
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={isDeleting}
                      aria-label="Delete review"
                      title="Delete review"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    />
                  }
                >
                  {isDeleting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete review?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes the review and its findings from
                      PR Scout. It will not affect the pull request on GitHub.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusBg(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-500/10";
    case "PROCESSING":
      return "bg-blue-500/10";
    case "PENDING":
      return "bg-amber-500/10";
    case "FAILED":
      return "bg-red-500/10";
    default:
      return "bg-muted";
  }
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    "default" | "secondary" | "outline" | "destructive"
  > = {
    COMPLETED: "default",
    PROCESSING: "secondary",
    PENDING: "outline",
    FAILED: "destructive",
    CANCELLED: "secondary",
  };

  return (
    <Badge variant={variants[status] || "secondary"}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

function StatusIcon({
  status,
  className,
  spin = true,
}: {
  status: string;
  className?: string;
  spin?: boolean;
}) {
  switch (status) {
    case "COMPLETED":
      return (
        <CheckCircle
          className={cn("text-emerald-600 dark:text-emerald-400", className)}
        />
      );
    case "PROCESSING":
      return (
        <Loader2
          className={cn(
            "text-blue-600 dark:text-blue-400",
            spin && "animate-spin",
            className,
          )}
        />
      );
    case "PENDING":
      return (
        <Clock
          className={cn("text-amber-600 dark:text-amber-400", className)}
        />
      );
    case "FAILED":
      return (
        <XCircle className={cn("text-red-600 dark:text-red-400", className)} />
      );
    default:
      return (
        <GitPullRequest className={cn("text-muted-foreground", className)} />
      );
    case "CANCELLED":
      return <XCircle className={cn("text-muted-foreground", className)} />;
  }
}

function RiskScoreBadge({ score }: { score: number }) {
  const config = getRiskConfig(score);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium",
        config.textColor,
      )}
    >
      <span className={cn("w-2 h-2 rounded-full", config.barColor)} />
      {config.label}
      <span className="text-muted-foreground font-normal tabular-nums">
        {score}
      </span>
    </span>
  );
}

function getRiskConfig(score: number) {
  if (score < 25)
    return {
      label: "Low",
      textColor: "text-emerald-600 dark:text-emerald-400",
      barColor: "bg-emerald-500",
    };
  if (score < 50)
    return {
      label: "Medium",
      textColor: "text-amber-600 dark:text-amber-400",
      barColor: "bg-amber-500",
    };
  if (score < 75)
    return {
      label: "High",
      textColor: "text-orange-600 dark:text-orange-400",
      barColor: "bg-orange-500",
    };
  return {
    label: "Critical",
    textColor: "text-red-600 dark:text-red-400",
    barColor: "bg-red-500",
  };
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
