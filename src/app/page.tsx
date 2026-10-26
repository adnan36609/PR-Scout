import { HealthCheck } from "@/components/health-check";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <div>
        <h1>Welcome to PR Scout</h1>
        <p>Start reviewing your code today!</p>
      </div>
      <div className="flex gap-4">
        <Link href="/sign-in">
          <Button>SignIn</Button>
        </Link>
        <Link href="/sign-up">
          <Button>SignUp</Button>
        </Link>
        <HealthCheck />
      </div>
    </div>
  );
}
