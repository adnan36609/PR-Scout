import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { LandingHeader } from "@/components/landing-header";
import { HeroSection } from "@/components/hero-section";
import { TechStack } from "@/components/tech-stack";
import { FeaturesSection } from "@/components/features-section";
import { WorkflowSection } from "@/components/workflow-section";
import { ReliabilitySection } from "@/components/reliability-section";
import { CtaSection } from "@/components/cta-section";
import { LandingFooter } from "@/components/landing-footer";
import { InteractiveBackground } from "@/components/interactive-background";
import { ScrollProgress } from "@/components/scroll-progress";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "PR Scout — AI-Powered Pull Request Reviews",
  description:
    "Review GitHub pull requests with AI-assisted findings, severity classifications, and risk scores.",
  openGraph: {
    title: "PR Scout — AI-Powered Pull Request Reviews",
    description:
      "Understand pull-request changes with structured AI-assisted code reviews.",
    type: "website",
  },
};

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const isAuthenticated = Boolean(session?.user);

  return (
    <main id="top" className="min-h-screen overflow-x-clip text-foreground">
      <InteractiveBackground />
      <ScrollProgress />
      <LandingHeader isAuthenticated={isAuthenticated} />
      <div className="container mx-auto space-y-20 px-4 pb-10 pt-10 sm:space-y-24 sm:pt-14 lg:space-y-28">
        <HeroSection isAuthenticated={isAuthenticated} />
        <Reveal>
          <TechStack />
        </Reveal>
        <Reveal>
          <FeaturesSection />
        </Reveal>
        <WorkflowSection />
        <ReliabilitySection />
      </div>

      <div className="relative flex min-h-[calc(100svh-4rem)] flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-linear-to-t from-emerald-500/10 to-transparent"
        />
        <div className="container mx-auto flex flex-1 items-center px-4 py-8">
          <div className="w-full">
            <Reveal>
              <CtaSection isAuthenticated={isAuthenticated} />
            </Reveal>
          </div>
        </div>
        <LandingFooter />
      </div>
    </main>
  );
}
