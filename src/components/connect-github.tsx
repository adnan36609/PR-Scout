"use client";

import { useState } from "react";
import { linkSocial } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FaGithub } from "react-icons/fa";

interface ConnectGitHubProps {
  title?: string;
  description?: string;
  className?: string;
}

export function ConnectGithub({
  title = "Connect your GitHub account",
  description = "Link your GitHub account to access your repositories and enable AI code reviews.",
  className,
}: ConnectGitHubProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    setIsConnecting(true);
    setError("");

    try {
      const result = await linkSocial({
        provider: "github",
        callbackURL: window.location.href,
        errorCallbackURL: `${window.location.origin}/error`,
      });

      if (result.error) {
        setError(
          result.error.message || "Unable to connect GitHub. Please try again.",
        );
        setIsConnecting(false);
      }
    } catch (error) {
      console.error("Failed to connect GitHub:", error);
      setError("Unable to connect GitHub. Please try again.");
      setIsConnecting(false);
    }
  };

  return (
    <Card className={cn(className)}>
      <CardContent className="py-12 text-center">
        <div className="mx-auto size-14 rounded-full bg-muted flex items-center justify-center">
          <FaGithub className="text-muted-foreground size-7" />
        </div>
        <h3 className="mt-4 font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          {description}
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button
          className="mt-6"
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <FaGithub className="size-4" />
              Connect GitHub
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
