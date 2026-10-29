import { serve } from "inngest/next";
import { inngest, functions } from "@/server/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});