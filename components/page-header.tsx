// Shared heading block for admin menu pages — keeps every main section's
// title/description/action row identical.
export function PageHeader({
  title,
  description,
  action,
  titleAccessory,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  titleAccessory?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          {titleAccessory}
        </div>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
