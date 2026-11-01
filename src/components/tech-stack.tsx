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
import { Caveat_Brush, Reenie_Beanie } from "next/font/google";

const script = Reenie_Beanie({ subsets: ["latin"], weight: "400" });
const brush = Caveat_Brush({ subsets: ["latin"], weight: "400" });

const technologies = [
  { name: "Next.js", Icon: SiNextdotjs, hoverColor: "hover:text-foreground" },
  {
    name: "TypeScript",
    Icon: SiTypescript,
    hoverColor: "hover:text-[#3178C6]",
  },
  {
    name: "Google Gemini",
    Icon: SiGooglegemini,
    hoverColor: "hover:text-[#EB5D4D]",
  },
  { name: "Inngest", Icon: Workflow, hoverColor: "hover:text-[#2C9B63]" },
  { name: "GitHub", Icon: SiGithub, hoverColor: "hover:text-foreground" },
  { name: "Prisma", Icon: SiPrisma, hoverColor: "hover:text-[#5A67D8]" },
  { name: "Neon PostgreSQL", Icon: SiNeon, hoverColor: "hover:text-[#34D59A]" },
  {
    name: "Better Auth",
    Icon: SiBetterauth,
    hoverColor: "hover:text-violet-500",
  },
];

export function TechStack() {
  return (
    <section className="border-y border-border py-6">
      <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Powered by modern stack
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
      <a
        href="https://github.com/adnan36609"
        target="_blank"
        rel="noreferrer"
        className="group mt-14 flex -rotate-2 items-center justify-center gap-3 transition-transform duration-300 hover:rotate-0 md:-translate-x-5 md:justify-end"
      >
        {" "}
        <span
          aria-hidden
          className="h-px w-8 bg-border transition-all duration-500 group-hover:w-14 group-hover:bg-emerald-400/70"
        />{" "}
        <span
          className={`${script.className} text-2xl text-muted-foreground/70 transition-colors duration-300 group-hover:text-muted-foreground sm:text-3xl`}
        >
          {" "}
          Developed by{" "}
        </span>{" "}
        <span
          className={`${brush.className} relative inline-block text-2xl text-foreground/80 transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:text-emerald-400 sm:text-3xl`}
        >
          {" "}
          Adnan.{" "}
          <span
            aria-hidden
            className="absolute -bottom-1 left-0 h-px w-0 bg-emerald-400/70 transition-all duration-500 group-hover:w-full"
          />{" "}
        </span>{" "}
      </a>
    </section>
  );
}
