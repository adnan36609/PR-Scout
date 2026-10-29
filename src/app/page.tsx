import { HealthCheck } from "@/components/health-check";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome to PR Scout
        </h1>

        <p className="mt-2 text-muted-foreground">
          AI-powered code reviews for your GitHub pull requests.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/sign-in"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Sign In
        </Link>

        <Link
          href="/sign-up"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Get Started
        </Link>
      </div>

      <HealthCheck />
    </main>
  );
}
