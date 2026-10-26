import { Header } from "@/components/header";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }
  return (
    <div className="min-h-screen bg-background">
      <Header user={session.user} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}