import { Workflow } from "lucide-react";
import {
  SiNextdotjs,
  SiTypescript,
  SiGooglegemini,
  SiGithub,
  SiPrisma,
  SiNeon,
  SiBetterauth,
} from "@icons-pack/react-simple-icons";

const technologies = [
  { name: "Next.js", Icon: SiNextdotjs, hoverColor: "hover:text-foreground" },
  { name: "TypeScript", Icon: SiTypescript, hoverColor: "hover:text-[#3178C6]" },
  { name: "Google Gemini", Icon: SiGooglegemini, hoverColor: "hover:text-[#EB5D4D]" },
  { name: "Inngest", Icon: Workflow, hoverColor: "hover:text-[#2C9B63]" },
  { name: "GitHub", Icon: SiGithub, hoverColor: "hover:text-foreground" },
  { name: "Prisma", Icon: SiPrisma, hoverColor: "hover:text-[#5A67D8]" },
  { name: "Neon PostgreSQL", Icon: SiNeon, hoverColor: "hover:text-[#34D59A]" },
  { name: "Better Auth", Icon: SiBetterauth, hoverColor: "hover:text-violet-500" },
];

export function TechStack() {
  return (
    <section className="border-y border-border py-6">
      <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Built with
      </p>

      <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
        {technologies.map(({ name, Icon, hoverColor }) => (
          <li
            key={name}
            className={`group inline-flex cursor-default items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/60 ${hoverColor}`}
          >
            <Icon
              aria-hidden
              color="currentColor"
              size={17}
              className="shrink-0 transition-transform duration-200 group-hover:scale-110"
            />
            <span>{name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}