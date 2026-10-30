import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "pr-scout",
  checkpointing: {
    maxRuntime: "210s",
  },
});