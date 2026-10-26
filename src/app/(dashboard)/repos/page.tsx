"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  GitBranch,
  Lock,
  Globe,
  RefreshCw,
  Plus,
  Trash2,
  ArrowRight,
  Star,
  GitPullRequest,
  Search,
  X,
  CheckCircle,
  FolderGit2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ConnectGithub } from "@/components/connect-github";

interface GitHubRepo {
  githubId: number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  stars: number;
  updatedAt: string;
}

const languageColors: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-400",
  Python: "bg-green-500",
  Go: "bg-cyan-500",
  Rust: "bg-orange-500",
  Java: "bg-red-500",
  Ruby: "bg-red-400",
  PHP: "bg-purple-500",
  "C#": "bg-green-600",
  "C++": "bg-pink-500",
  C: "bg-gray-500",
  Swift: "bg-orange-400",
  Kotlin: "bg-purple-400",
  Dart: "bg-blue-400",
  Vue: "bg-emerald-500",
  Svelte: "bg-orange-600",
};

export default function ReposPage() {
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [showGitHubRepos, setShowGitHubRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const connectedRepos = trpc.repository.list.useQuery();
  const githubRepos = trpc.repository.fetchFromGithub.useQuery(undefined, {
    enabled: showGitHubRepos,
  });

  const connectMutation = trpc.repository.connect.useMutation({
    onSuccess: () => {
      connectedRepos.refetch();
      setSelectedRepos(new Set());
      setShowGitHubRepos(false);
    },
  });

  const disconnectMutation = trpc.repository.disconnect.useMutation({
    onSuccess: () => {
      connectedRepos.refetch();
    },
  });

  const connectedIds = new Set(
    connectedRepos.data?.map((repo) => repo.githubId) || [],
  );

  const availableRepos =
    githubRepos.data?.filter((repo) => !connectedIds.has(repo.githubId)) || [];

  const filteredAvailableRepos = availableRepos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleRepo = (githubId: number) => {
    const next = new Set(selectedRepos);
    if (next.has(githubId)) {
      next.delete(githubId);
    } else {
      next.add(githubId);
    }
    setSelectedRepos(next);
  };

  const handleConnect = () => {
    const reposToConnect = availableRepos
      .filter((r) => selectedRepos.has(r.githubId))
      .map((r) => ({
        githubId: r.githubId,
        name: r.name,
        fullName: r.fullName,
        private: r.private,
        htmlUrl: r.htmlUrl,
      }));
    connectMutation.mutate({ repos: reposToConnect });
  };

  const selectAll = () => {
    setSelectedRepos(new Set(filteredAvailableRepos.map((r) => r.githubId)));
  };

  const clearSelection = () => {
    setSelectedRepos(new Set());
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Repositories
          </h1>
          <p className="text-muted-foreground mt-1">
            Select repositories to connect to your account.
          </p>
        </div>
        <Button
          onClick={() => {
            setShowGitHubRepos(!showGitHubRepos);
            setSearchQuery("");
            setSelectedRepos(new Set());
          }}
          variant={showGitHubRepos ? "outline" : "default"}
        >
          {showGitHubRepos ? (
            <>
              <X className="size-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="size-4" />
              Add Repository
            </>
          )}
        </Button>
      </div>

      {showGitHubRepos && (
        <Card className="overflow-hidden">
          <div className="border-b border-border/60 bg-muted/30 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Import GitHub Repositories</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Select repositories to import from GitHub.
                </p>
              </div>
              <Button
                variant={"ghost"}
                size={"icon-sm"}
                onClick={() => githubRepos.refetch()}
                disabled={githubRepos.isFetching}
              >
                <RefreshCw
                  className={cn(
                    "size-4",
                    githubRepos.isFetching && "animate-spin",
                  )}
                />
              </Button>
            </div>
          </div>

          <CardContent className="p-0">
            {githubRepos.isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : githubRepos.error ? (
              <div className="p-6">
                {githubRepos.error.data?.code === "PRECONDITION_FAILED" ? (
                  <ConnectGithub
                    title="Github account not connected"
                    description="Connect your Github account to view your repositories."
                  />
                ) : (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-center">
                    <p className="text-sm text-destructive">
                      {githubRepos.error.message}
                    </p>
                  </div>
                )}
              </div>
            ) : availableRepos.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto size-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle className="size-6 text-emerald-500" />
                </div>
                <p className="mt-4 font-medium">All caught up!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  All your repos are already connected!
                </p>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-border/60 flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search repos"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <button
                      onClick={selectAll}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Select all
                    </button>
                    {selectedRepos.size > 0 && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <button
                          onClick={clearSelection}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Clear
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="max-h-100 overflow-y-auto">
                  {filteredAvailableRepos.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-sm text-muted-foreground">
                        {" "}
                        No repositories match your search.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {filteredAvailableRepos.map((repo) => (
                        <RepoSelectItem
                          key={repo.githubId}
                          repo={repo}
                          selected={selectedRepos.has(repo.githubId)}
                          onToggle={() => toggleRepo(repo.githubId)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-border/60 bg-muted/60 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedRepos.size} of {filteredAvailableRepos.length}{" "}
                    selected
                  </p>
                  <Button
                    onClick={handleConnect}
                    disabled={
                      selectedRepos.size === 0 || connectMutation.isPending
                    }
                  >
                    {connectMutation.isPending ? (
                      <>
                        <RefreshCw className="size-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        {connectMutation.isPending ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            Connect
                            {selectedRepos.size > 0 &&
                              ` (${selectedRepos.size})`}
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Connected Repositories
          </h2>
          {connectedRepos.data && connectedRepos.data.length > 0 && (
            <Badge variant={"secondary"} className="tabular-nums">
              {connectedRepos.data.length}
            </Badge>
          )}
        </div>

        {connectedRepos.isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : connectedRepos.data?.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mx-auto h-14 rounded-full bg-muted flex items-center justify-center">
                <FolderGit2 className="size-7 text-muted-foreground" />
              </div>
              <p className="mt-4 font-medium">
                No connected repositories found.
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Connect your GitHub repositories to start getting AI-powered
                code reviews on your pull requests.
              </p>
              <Button className="mt-6" onClick={() => setShowGitHubRepos(true)}>
                <Plus className="size-4" />
                Add your first repository
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {connectedRepos.data?.map((repo) => (
              <ConnectedRepoCard
                key={repo.id}
                repo={repo}
                onDisconnect={() => disconnectMutation.mutate({ id: repo.id })}
                isDisconnecting={disconnectMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConnectedRepoCard({
  repo,
  onDisconnect,
  isDisconnecting,
}: {
  repo: {
    id: string;
    fullName: string;
    private: boolean;
    createdAt: Date;
  };
  onDisconnect: () => void;
  isDisconnecting: boolean;
}) {
  return (
    <Card className="group hover:border-primary/30 transition-all hover:shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/repos/${repo.id}`} className="flex-1 min-w-0">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "size-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  repo.private
                    ? "bg-emerald-500/10 group-hover:bg-emerald-500/15"
                    : "bg-emerald-500/10 group-hover:bg-emerald-500/15",
                )}
              >
                {repo.private ? (
                  <Lock className="size-4 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Globe className="size-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div className="min-w-0">
                <span className="font-medium block truncate group-hover:text-primary transition-colors">
                  {repo.fullName}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={"outline"}
                    className="text-xs px-1.5 py-0 h-5"
                  >
                    {repo.private ? "Private" : "Public"}
                  </Badge>
                </div>
              </div>
            </div>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={isDisconnecting}
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                />
              }
            >
              <Trash2 className="size-4" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect Repository</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to disconnect{" "}
                  <span className="font-medium text-foreground">
                    {repo.fullName}
                  </span>
                  ? This will remove all review history for this repository.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDisconnect}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Connected {formatDate(repo.createdAt)}
          </span>
          <Link href={`/repos/${repo.id}`}>
            <Button
              variant={"ghost"}
              size={"sm"}
              className="h-7 text-xs gap-1.5 -mr-2"
            >
              View PRs
              <ArrowRight className="size-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function RepoSelectItem({
  repo,
  selected,
  onToggle,
}: {
  repo: GitHubRepo;
  selected: boolean;
  onToggle: () => void;
}) {
  const langColor = repo.language
    ? languageColors[repo.language] || "bg-gray-400"
    : null;

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-4 px-6 py-4 transition-colors",
        selected ? "bg-primary/5" : "hover:bg-muted/50",
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={onToggle}
        className="shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{repo.fullName}</span>
          {repo.private && (
            <Lock className="size-3 text-muted-foreground shrink-0" />
          )}
        </div>
        {repo.description && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {repo.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4 shrink-0">
        {repo.stars > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3" />
            <span className="tabular-nums">{repo.stars}</span>
          </span>
        )}
        {repo.language && (
          <div className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-full shrink-0", langColor)} />
            <span className="text-xs text-muted-foreground">
              {repo.language}
            </span>
          </div>
        )}
      </div>
    </label>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
