// Placeholder shown inside a dashboard while the next section loads. The menu stays in place.
export function DashLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-paper-deep">
        <div className="loading-bar h-full w-1/3 rounded-full bg-accent" />
      </div>
      <div className="skeleton h-9 w-56 rounded-xl" />
      <div className="skeleton mt-3 h-4 w-80 max-w-full rounded-lg" />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="skeleton h-28 rounded-2xl" />
        <div className="skeleton h-28 rounded-2xl" />
        <div className="skeleton h-28 rounded-2xl" />
      </div>
      <div className="skeleton mt-6 h-56 rounded-2xl" />
    </div>
  );
}
