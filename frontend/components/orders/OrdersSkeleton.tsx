export default function OrdersSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Tabs skeleton */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 bg-gray-200 rounded-lg w-24" />
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white border border-gray-100 rounded-xl p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-5 bg-gray-200 rounded w-56" />
                  <div className="h-5 bg-gray-200 rounded-full w-24" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3 mt-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j}>
                      <div className="h-3 bg-gray-200 rounded w-14 mb-1.5" />
                      <div className="h-4 bg-gray-200 rounded w-28" />
                    </div>
                  ))}
                </div>
                <div className="h-3 bg-gray-200 rounded w-32 mt-3" />
              </div>
              <div className="flex gap-2 sm:flex-col sm:items-end">
                <div className="h-9 bg-gray-200 rounded-lg w-28" />
                <div className="h-9 bg-gray-200 rounded-lg w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
