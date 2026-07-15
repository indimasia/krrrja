// Segment-level loading skeleton for all /pro/* (platform admin) pages.
export default function ProLoading() {
  return (
    <div className="animate-pulse space-y-6 p-8">
      <div className="space-y-3">
        <div className="h-8 w-64 rounded-full bg-muted" />
        <div className="h-4 w-96 max-w-full rounded-full bg-muted" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-3xl bg-muted" />
        ))}
      </div>
      <div className="h-64 rounded-3xl bg-muted" />
    </div>
  );
}
