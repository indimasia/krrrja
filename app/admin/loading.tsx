// Segment-level loading skeleton for all /admin/* pages — mirrors the
// PageHeader + card frame so navigation feels instant.
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-3">
        <div className="h-8 w-64 rounded-full bg-muted" />
        <div className="h-4 w-96 max-w-full rounded-full bg-muted" />
      </div>
      <div className="h-40 rounded-3xl bg-muted" />
      <div className="h-40 rounded-3xl bg-muted" />
    </div>
  );
}
