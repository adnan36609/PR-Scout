"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  FilePlus,
  FileMinus,
  FileEdit,
  FileText,
  Copy,
  Check,
  FolderTree,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DiffFile {
  sha: string;
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  previousFilename?: string;
}

interface DiffViewerProps {
  files: DiffFile[];
}

export function DiffViewer({ files }: DiffViewerProps) {
  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(
    new Set(files.slice(0, 3).map((f) => f.sha)),
  );

  const toggleFile = (sha: string) => {
    const next = new Set(expandedFiles);
    if (next.has(sha)) {
      next.delete(sha);
    } else {
      next.add(sha);
    }
    setExpandedFiles(next);
  };

  const expandAll = () => {
    setExpandedFiles(new Set(files.map((f) => f.sha)));
  };

  const collapseAll = () => {
    setExpandedFiles(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <FolderTree className="size-4 text-primary" />
            </div>
            <div>
              <span className="text-base font-medium tabular-nums">
                {files.length}
              </span>
              <span className="text-sm text-muted-foreground ml-1.5">
                {files.length === 1 ? "file" : "files"} changed
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Plus className="size-3.5" />
              <span className="tabular-nums">{totalAdditions}</span>
            </span>
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <Minus className="size-3.5" />
              <span className="tabular-nums">{totalDeletions}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant={"ghost"} size={"sm"} onClick={expandAll}>
            Expand all
          </Button>
          <Button variant={"ghost"} size={"sm"} onClick={collapseAll}>
            Collapse all
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {files.map((file) => (
          <DiffFileCard
            key={file.sha}
            file={file}
            expanded={expandedFiles.has(file.sha)}
            onToggle={() => toggleFile(file.sha)}
          />
        ))}
      </div>
    </div>
  );
}

function DiffFileCard({
  file,
  expanded,
  onToggle,
}: {
  file: DiffFile;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const StatusIcon = getStatusIcon(file.status);
  const statusConfig = getStatusConfig(file.status);

  const copyFilename = () => {
    navigator.clipboard.writeText(file.filename);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pathParts = file.filename.split("/");
  const fileName = pathParts.pop();
  const directory = pathParts.join("/");

  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="shrink-0">
          {expanded ? (
            <ChevronDown className="size-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
        </div>

        <div className={cn("p-1.5 rounded-md shrink-0", statusConfig.bg)}>
          {React.createElement(StatusIcon, {
            className: cn("size-4 text-muted-foreground truncate"),
          })}
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          {directory && (
            <span className="text-sm text-muted-foreground font-mono truncate">
              {directory}/
            </span>
          )}
          <span className="text-sm font-medium font-mono truncate">
            {fileName}
          </span>
          {file.previousFilename && (
            <Badge variant={"outline"} className="text-xs shrink-0">
              {file.previousFilename}
            </Badge>
          )}
          {file.changes > 300 && (
            <Badge
              variant={"outline"}
              className="text-[10px] shrink-0 gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
            >
              <AlertCircle className="size-3" />
              Large changes
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Change bar visualization */}
          <div className="hidden sm:flex items-center gap-0.5">
            {Array.from({ length: Math.min(5, file.additions) }).map((_, i) => (
              <div
                key={`add-${i}`}
                className="w-1.5 h-3 rounded-sm bg-emerald-500"
              />
            ))}
            {Array.from({ length: Math.min(5, file.deletions) }).map((_, i) => (
              <div
                key={`del-${i}`}
                className="w-1.5 h-3 rounded-sm bg-red-500"
              />
            ))}
            {file.additions + file.deletions === 0 && (
              <div className="w-1.5 h-3 rounded-sm bg-muted-foreground" />
            )}
          </div>

          <div className="flex items-center gap-2 text-xs tabular-nums">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              +{file.additions}
            </span>
            <span className="text-red-600 dark:text-red-400 font-medium">
              -{file.deletions}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <CardContent className="p-0 border-t border-border/60">
          {file.patch ? (
            <div className="relative">
              <Button
                variant={"ghost"}
                size={"icon-sm"}
                className="absolute top-2 right-2 z-10 opacity-10 hover:opacity-100 focus:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  copyFilename();
                }}
              >
                {copied ? <Check /> : <Copy className="w-4 h-4" />}
              </Button>

              <DiffContent patch={file.patch} />
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <FileText className="size-8 mx-auto mb-2 opacity-50" />
              <p>No diff available for this file.</p>
              <p className="text-xs mt-1">
                Binary file or too large to display.
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function DiffContent({ patch }: { patch: string }) {
  const lines = patch.split("\n");
  let oldLineNum = 0;
  let newLineNum = 0;

  const parsedLines: {
    index: number;
    line: string;
    lineInfo: LineInfo;
    oldNum: number | null;
    newNum: number | null;
  }[] = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!;
    const lineInfo = parseLine(line);

    let oldNum: number | null = null;
    let newNum: number | null = null;

    if (lineInfo.isHunk) {
      const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);

      if (match?.[1] && match?.[2]) {
        oldLineNum = parseInt(match[1], 10);
        newLineNum = parseInt(match[2], 10);
      }
    } else if (lineInfo.type === "deletion") {
      oldNum = oldLineNum;
      oldLineNum++;
    } else if (lineInfo.type === "addition") {
      newNum = newLineNum;
      newLineNum++;
    } else if (lineInfo.type === "context") {
      oldNum = oldLineNum;
      newNum = newLineNum;
      oldLineNum++;
      newLineNum++;
    }

    parsedLines.push({ index, line, lineInfo, oldNum, newNum });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <tbody>
          {parsedLines.map(({ index, line, lineInfo, oldNum, newNum }) => (
            <DiffTableRow
              key={index}
              line={line}
              oldNum={oldNum}
              newNum={newNum}
              lineInfo={lineInfo}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}


function getStatusIcon(status: string) {
  switch (status) {
    case "added":
      return FilePlus;
    case "removed":
      return FileMinus;
    case "modified":
    case "changed":
      return FileEdit;
    case "renamed":
      return FileEdit;
    default:
      return FileText;
  }
}

function getStatusConfig(status: string) {
  switch (status) {
    case "added":
      return {
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10",
      };
    case "removed":
      return {
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-500/10",
      };
    case "modified":
    case "changed":
      return {
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10",
      };
    case "renamed":
      return {
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-500/10",
      };
    default:
      return {
        color: "text-muted-foreground",
        bg: "bg-muted",
      };
  }
}

interface LineInfo {
  type: "addition" | "deletion" | "context" | "hunk";
  isHunk: boolean;
}

function parseLine(line: string): LineInfo {
  if (line.startsWith("@@")) {
    return { type: "hunk", isHunk: true };
  }
  if (line.startsWith("+")) {
    return { type: "addition", isHunk: false };
  }
  if (line.startsWith("-")) {
    return { type: "deletion", isHunk: false };
  }
  return { type: "context", isHunk: false };
}

function DiffTableRow({
  line,
  lineInfo,
  oldNum,
  newNum,
}: {
  line: string;
  lineInfo: LineInfo;
  oldNum: number | null;
  newNum: number | null;
}) {
  const bgClass = {
    addition: "bg-emerald-500/10",
    deletion: "bg-red-500/10",
    hunk: "bg-blue-500/10",
    context: "",
  }[lineInfo.type];

  const textClass = {
    addition: "text-emerald-700 dark:text-emerald-300",
    deletion: "text-red-700 dark:text-red-300",
    hunk: "text-blue-600 dark:text-blue-400",
    context: "text-foreground",
  }[lineInfo.type];

  const lineNumClass = {
    addition: "bg-emerald-500/5 text-emerald-600/70 dark:text-emerald-400/70",
    deletion: "bg-red-500/5 text-red-600/70 dark:text-red-400/70",
    hunk: "bg-blue-500/5",
    context: "text-muted-foreground/50",
  }[lineInfo.type];

  if (lineInfo.isHunk) {
    return (
      <tr className={bgClass}>
        <td
          colSpan={3}
          className={cn("px-4 py-1.5 text-xs", textClass, lineNumClass)}
        >
          {line}
        </td>
      </tr>
    );
  }

  return (
    <tr className={cn("group", bgClass)}>
      <td
        className={cn(
          "w-12 px-2 py-0.5 text-right select-none border-r border-border/30",
          lineNumClass,
        )}
      >
        {oldNum || ""}
      </td>
      <td
        className={cn(
          "w-12 px-2 py-0.5 text-right select-none border-r border-border/30",
          lineNumClass,
        )}
      >
        {newNum || ""}
      </td>
      <td className={cn("px-4 py-0.5 whitespace-pre", textClass)}>
        {line.slice(1) || " "}
      </td>
    </tr>
  );
}