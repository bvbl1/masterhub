export default function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div className="bg-slate-50 border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-6 py-10 md:py-14">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gray-200" />
            <div className="flex-1 text-center md:text-left">
              <div className="h-8 bg-gray-200 rounded-lg w-56 mx-auto md:mx-0 mb-3" />
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2.5">
                <div className="h-4 bg-gray-200 rounded w-28" />
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-32" />
              </div>
              <div className="flex items-center justify-center md:justify-start gap-3 mt-5">
                <div className="h-10 bg-gray-200 rounded-lg w-40" />
                <div className="h-10 bg-gray-200 rounded-lg w-36" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust metrics skeleton */}
      <div className="max-w-[1200px] mx-auto px-6 mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3.5 bg-white border border-gray-100 rounded-xl px-5 py-4"
            >
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div>
                <div className="h-6 bg-gray-200 rounded w-16 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* About skeleton */}
      <div className="max-w-[1200px] mx-auto px-6 mt-10">
        <div className="h-6 bg-gray-200 rounded w-24 mb-4" />
        <div className="space-y-2.5">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>
      </div>

      {/* Services skeleton */}
      <div className="max-w-[1200px] mx-auto px-6 mt-10">
        <div className="h-6 bg-gray-200 rounded w-32 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden"
            >
              <div className="w-full aspect-16/10 bg-gray-200" />
              <div className="p-4">
                <div className="h-5 bg-gray-200 rounded w-4/5 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-full mb-1" />
                <div className="h-4 bg-gray-200 rounded w-3/5 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-16 mb-1" />
                    <div className="h-6 bg-gray-200 rounded w-12" />
                  </div>
                  <div className="h-9 bg-gray-200 rounded-lg w-28" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews skeleton */}
      <div className="max-w-[1200px] mx-auto px-6 mt-10 pb-10">
        <div className="h-6 bg-gray-200 rounded w-24 mb-6" />
        <div className="flex flex-col sm:flex-row gap-8 mb-8 p-6 bg-gray-50 rounded-xl">
          <div className="text-center sm:pr-8">
            <div className="h-14 bg-gray-200 rounded w-16 mx-auto mb-2" />
            <div className="h-4 bg-gray-200 rounded w-24 mx-auto" />
          </div>
          <div className="flex-1 space-y-2.5">
            {[5, 4, 3, 2, 1].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 bg-gray-200 rounded w-12" />
                <div className="flex-1 h-2.5 bg-gray-200 rounded-full" />
                <div className="h-4 bg-gray-200 rounded w-10" />
              </div>
            ))}
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="py-5 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-28 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-20 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mt-1.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
