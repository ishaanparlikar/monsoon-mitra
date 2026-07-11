export default function Loading() {
  return (
    <div className="min-h-screen bg-paper-dry pb-32 safe-all animate-pulse">
      {/* Header skeleton */}
      <div className="sticky top-0 z-40 bg-paper-dry border-b border-cloud-200 px-4 py-3 safe-top">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cloud-200" />
          <div className="h-5 w-36 bg-cloud-200 rounded-full" />
        </div>
      </div>

      <main className="px-4 py-4 space-y-4 pb-28">
        {/* Risk score card skeleton */}
        <div className="rounded-2xl bg-cloud-100 p-5 h-28" />

        {/* Critical actions skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-32 bg-cloud-200 rounded-full" />
          {[1, 2].map(i => (
            <div key={i} className="rounded-2xl bg-cloud-100 p-4 h-16" />
          ))}
        </div>

        {/* Alerts skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-28 bg-cloud-200 rounded-full" />
          <div className="rounded-2xl bg-cloud-100 p-4 h-20" />
        </div>

        {/* Checklist skeleton */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-5 w-44 bg-cloud-200 rounded-full" />
            <div className="h-4 w-16 bg-cloud-200 rounded-full" />
          </div>
          {/* Progress bar */}
          <div className="h-3 bg-cloud-100 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-cloud-300 rounded-full" />
          </div>
          {/* Category cards */}
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl bg-cloud-100 p-4 h-16" />
          ))}
        </div>
      </main>

      {/* Bottom nav skeleton */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-cloud-200 px-2 py-2">
        <div className="grid grid-cols-5 gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-14 rounded-xl bg-cloud-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
