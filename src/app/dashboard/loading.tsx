export default function DashboardLoading() {
  return (
    <div className="space-y-4 sm:space-y-6" aria-label="Loading dashboard" role="status">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-11 w-32 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-56 animate-pulse rounded-2xl bg-muted" />
        <div className="h-56 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}