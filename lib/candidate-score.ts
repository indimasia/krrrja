// Score → badge tint. Pure, no server or client deps, so it's safe to import
// from both server components (candidates page) and client components
// (candidate-detail-dialog). Keep it out of any "use client" module — exports
// from those become client references and can't be called during SSR.
export function scoreTint(score: number | null): string {
  if (score === null) return "bg-muted text-muted-foreground";
  if (score >= 85) return "bg-secondary text-secondary-foreground";
  if (score >= 60) return "bg-amber-100 text-amber-800";
  return "bg-muted text-muted-foreground";
}
