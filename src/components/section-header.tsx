export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div className="sm:max-w-2xl">
        <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight">
          {title}
        </h2>
      </div>
      <p className="max-w-lg text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}