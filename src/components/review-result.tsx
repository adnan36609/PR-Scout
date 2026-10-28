"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bug,
  Shield,
  Zap,
  Paintbrush,
  Lightbulb,
  FileCode2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  CircleDot,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewComment {
  file: string;
  line: number;
  severity: string;
  category?: string;
  message: string;
  suggestion?: string;
}

interface ReviewResultProps {
  review: {
    id: string;
    status: string;
    summary: string | null;
    riskScore: number | null;
    comments: ReviewComment[] | unknown;
    error: string | null;
    createdAt: Date;
  };
}

export function ReviewResult({ review }: ReviewResultProps) {
  if (review.status === "PENDING") {
    return (
      <Card>
        <CardContent className="py-12 px-6">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
              <Clock className="size-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium">Queued for review</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                This review is queued for review and will be processed soon.
              </p>
            </div>
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="size-1.5 rounded-full bg-amber-500 animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (review.status === "PROCESSING") {
    return (
      <Card>
        <CardContent className="py-12 px-6">
          <div className="flex items-center gap-4">
            <div className="relative size-10 shrink-0">
              <svg className="size-10 -rotate-90" viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  strokeWidth="3"
                  className="stroke-muted"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  strokeWidth="3"
                  className="stroke-primary"
                  style={{
                    strokeDasharray: "100",
                    strokeDashoffset: "60",
                    animation: "spin 1s linear infinite",
                    transformOrigin: "center",
                  }}
                />
              </svg>
              <style jsx>{`
                @keyframes spin {
                  to {
                    transform: rotate(360deg);
                  }
                }
              `}</style>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium">Analysing code</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Scanning for bugs, security issues, and improvements
              </p>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              ~20s
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (review.status === "FAILED") {
    return (
      <Card className="overflow-hidden border-destructive/20">
        <CardContent className="p-0">
          <div className="relative py-20 px-6">
            <div className="absolute inset-0 bg-linear-to-b from-red-500/5 via-transparent to-red-500/5" />

            <div className="relative text-center">
              <div className="mx-auto size-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-6">
                <XCircle className="size-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-destructive">
                Failed to review code
              </h3>
              <p className="text-sm text-muted-foreground">
                {review.error || "Please try again later or contact support"}
              </p>
              <Button variant={"outline"} className="mt-6">
                Retry Analysis
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const comments = Array.isArray(review.comments)
    ? (review.comments as ReviewComment[])
    : [];

  const severityCounts = {
    critical: comments.filter((c) => c.severity === "critical").length,
    high: comments.filter((c) => c.severity === "high").length,
    medium: comments.filter((c) => c.severity === "medium").length,
    low: comments.filter((c) => c.severity === "low").length,
  };

  const totalIssues = comments.length;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-6">
          <RiskScoreSection score={review.riskScore ?? 0} />

          <div className="h-px bg-border/60" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Severity Breakdown
              </h3>
              <div
                className={cn(
                  "flex items-center justify-center min-w-10 px-3 py-1.5 rounded-lg",
                  totalIssues === 0 ? "bg-emerald-500/10" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "text-xl font-bold tabular-nums tracking-tight",
                    totalIssues === 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-foreground",
                  )}
                >
                  {totalIssues}
                </span>
              </div>
            </div>

            <SeverityDistributionBar
              counts={severityCounts}
              total={totalIssues}
            />

            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <SeverityLegendItem
                label="Critical"
                count={severityCounts.critical}
                color="bg-red-500"
              />
              <SeverityLegendItem
                label="High"
                count={severityCounts.high}
                color="bg-orange-500"
              />
              <SeverityLegendItem
                label="Medium"
                count={severityCounts.medium}
                color="bg-amber-500"
              />
              <SeverityLegendItem
                label="Low"
                count={severityCounts.low}
                color="bg-slate-400 dark:bg-slate-500"
              />
            </div>
          </div>

          {review.summary && (
            <>
              <div className="h-px bg-border/60" />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  AI Summary
                </h3>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {review.summary}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {comments.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-medium text-muted-foreground">
              Review Comments
            </h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {comments.length} {comments.length === 1 ? "issue" : "issues"}
            </span>
          </div>

          <div className="space-y-2">
            {comments.map((comment, index) => (
              <CommentCard key={index} comment={comment} index={index} />
            ))}
          </div>
        </div>
      ) : (
        review.status === "COMPLETED" && <NoIssuesCard />
      )}
    </div>
  );
}

function NoIssuesCard() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative py-16 px-6">
          <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 via-transparent to-emerald-500/5" />

          <div className="relative text-center">
            <div className="mx-auto size-16 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
              <CheckCircle2 className="size-8 text-emerald-500" />
            </div>
            <h3>Looking Good!</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              No issues were found. Your code follows best practices and appears
              to be well-written.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CommentCard({
  comment,
  index,
}: {
  comment: ReviewComment;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index < 3);
  const [copied, setCopied] = useState(false);
  const CategoryIcon = getCategoryIcon(comment.category);
  const severityConfig = getSeverityStyles(comment.severity);

  const copyLocation = () => {
    navigator.clipboard.writeText(`${comment.file}:${comment.line}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pathParts = comment.file.split("/");
  const fileName = pathParts.pop();
  const directory = pathParts.join("/");

  return (
    <Card>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="p-4 flex items-start gap-3">
          <div
            className={cn(
              "my-0.5 w-1 h-12 rounded-full shrink-0",
              severityConfig.bar,
            )}
          />

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={"outline"}
                className={cn(
                  "text-[10px] uppercase tracking-wider font-semibold",
                  severityConfig.badge,
                )}
              >
                {comment.severity}
              </Badge>

              {comment.category && (
                <Badge variant={"secondary"} className="gap-1 text-xs">
                  {React.createElement(CategoryIcon, {
                    className: "size-3",
                  })}
                  {comment.category}
                </Badge>
              )}

              <div className="flex-1" />

              {expanded ? (
                <ChevronDown className="size-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-4 text-muted-foreground" />
              )}
            </div>

            <p
              className={cn(
                "text-sm leading-relaxed",
                !expanded && "line-clamp-2",
              )}
            >
              {comment.message}
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation();
                copyLocation();
              }}
              className="group/file inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileCode2 className="size-3.5" />
              {directory && <span className="opacity-60">{directory}</span>}
              <span className="font-medium text-foreground ">{fileName}</span>
              <span className="text-foreground">:</span>
              <span className="text-primary font-medium">{comment.line}</span>
              {copied ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5 opacity-0 group-hover/file:opacity-100 trantransition-opacity" />
              )}
            </button>
          </div>
        </div>
      </button>

      {expanded && comment.suggestion && (
        <div className="px-4 pb-4">
          <div className="ml-4 rounded-lg bg-linear-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 rounded-md bg-emerald-500/20">
                <Lightbulb className="size-3.5 text-emerald-500" />
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Suggested Fix
              </span>
            </div>
            <p className="text-sm leading-relaxed pl-7">{comment.suggestion}</p>
          </div>
        </div>
      )}
    </Card>
  );
}

function SeverityDistributionBar({
  counts,
  total,
}: {
  counts: { critical: number; high: number; medium: number; low: number };
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="h-2 bg-emerald-500/20 rounded-full overflow-hidden">
        <div className="w-full h-full bg-emerald-500 rounded-full" />
      </div>
    );
  }

  const getWidth = (count: number) => `${(count / total) * 100}%`;

  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden flex">
      {counts.critical > 0 && (
        <div
          className="h-full bg-red-500 first:rounded-l-full last:rounded-r-full"
          style={{ width: getWidth(counts.critical) }}
        />
      )}
      {counts.high > 0 && (
        <div
          className="h-full bg-orange-500 first:rounded-l-full last:rounded-r-full"
          style={{ width: getWidth(counts.high) }}
        />
      )}
      {counts.medium > 0 && (
        <div
          className="h-full bg-amber-500 first:rounded-l-full last:rounded-r-full"
          style={{ width: getWidth(counts.medium) }}
        />
      )}
      {counts.low > 0 && (
        <div
          className="h-full bg-slate-400 dark:bg-slate-500 first:rounded-l-full last:rounded-r-full"
          style={{ width: getWidth(counts.low) }}
        />
      )}
    </div>
  );
}

function SeverityLegendItem({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("size-2 rounded-full", color)} />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium tabular-nums">{count}</span>
    </div>
  );
}

function RiskScoreSection({ score }: { score: number }) {
  const config = getRiskConfig(score);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Risk Score
        </h3>
        <div
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
            config.bg,
          )}
        >
          <span
            className={cn(
              "text-xl font-bold tabular-nums tracking-tight",
              config.color,
            )}
          >
            {score}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            /100
          </span>
        </div>
      </div>

      <div className="relative h-1.5">
        <div className="absolute inset-0 rounded-full bg-linear-to-r from-emerald-500 via-amber-500 to-red-500 opacity-15" />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-emerald-500 via-amber-500 to-red-500"
          style={{
            width: `${score}%`,
            transition: "width 0.3s ease-in-out",
          }}
        />
        <div
          className="absolute top-1/2 size-3.5 rounded-full bg-background border-2 shadow-md"
          style={{
            left: `${Math.min(Math.max(score, 2), 98)}%`,
            transform: "translateX(-50%) translateY(-50%)",
            borderColor: config.markerColor,
            transition: "left 0.3s ease-in-out",
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">Low</span>
        <span className="text-[11px] text-muted-foreground">Critical</span>
      </div>
    </div>
  );
}

function getRiskConfig(score: number) {
  if (score < 25) {
    return {
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      markerColor: "#10b981",
      label: "Low Risk",
      icon: ShieldCheck,
    };
  }
  if (score < 50) {
    return {
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      markerColor: "#f59e0b",
      label: "Medium Risk",
      icon: CircleDot,
    };
  }
  if (score < 75) {
    return {
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      markerColor: "#f97316",
      label: "High Risk",
      icon: ShieldAlert,
    };
  }
  return {
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    markerColor: "#ef4444",
    label: "Critical Risk",
    icon: ShieldX,
  };
}

function getSeverityStyles(severity: string) {
  switch (severity) {
    case "critical":
      return {
        bar: "bg-red-500",
        badge: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
      };
    case "high":
      return {
        bar: "bg-orange-500",
        badge:
          "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
      };
    case "medium":
      return {
        bar: "bg-amber-500",
        badge:
          "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      };
    default:
      return {
        bar: "bg-slate-400 dark:bg-slate-500",
        badge: "border-border bg-muted text-muted-foreground",
      };
  }
}

function getCategoryIcon(category?: string) {
  switch (category) {
    case "bug":
      return Bug;
    case "security":
      return Shield;
    case "performance":
      return Zap;
    case "style":
      return Paintbrush;
    case "suggestion":
      return Lightbulb;
    default:
      return CircleDot;
  }
}