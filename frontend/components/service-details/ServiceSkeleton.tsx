export default function ServiceSkeleton() {
  return (
    <div className="flex justify-center px-6 py-8 animate-pulse">
      <div className="max-w-[1200px] w-full">
        {/* Title skeleton */}
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded-lg w-3/4 mb-3" />
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
        </div>

        <div className="flex gap-8">
          {/* Main content skeleton */}
          <div className="flex-1 min-w-0">
            {/* Image skeleton */}
            <div className="w-full aspect-16/10 bg-gray-200 rounded-xl mb-3" />
            <div className="flex gap-3 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-20 h-16 bg-gray-200 rounded-lg" />
              ))}
            </div>

            {/* Description skeleton */}
            <div className="mb-8">
              <div className="h-6 bg-gray-200 rounded w-40 mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-4 bg-gray-200 rounded w-4/6" />
              </div>
            </div>

            {/* Features skeleton */}
            <div className="mb-8">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-200 rounded-full" />
                    <div className="h-4 bg-gray-200 rounded w-3/5" />
                  </div>
                ))}
              </div>
            </div>

            {/* Provider skeleton */}
            <div className="bg-gray-100 rounded-xl p-6 mb-8">
              <div className="h-6 bg-gray-200 rounded w-40 mb-4" />
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-48 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-4/5 mt-1" />
                </div>
              </div>
            </div>

            {/* Reviews skeleton */}
            <div>
              <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="py-5 border-b border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-28 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-4 bg-gray-200 rounded w-3/4 mt-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar skeleton */}
          <div className="w-[340px] shrink-0 hidden lg:block">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-9 bg-gray-200 rounded w-44 mb-5" />
              <div className="h-4 bg-gray-200 rounded w-52 mb-5 pb-5 border-b border-gray-100" />
              <div className="space-y-2.5 mb-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 bg-gray-200 rounded-full" />
                    <div className="h-4 bg-gray-200 rounded w-36" />
                  </div>
                ))}
              </div>
              <div className="h-11 bg-gray-200 rounded-lg mb-3" />
              <div className="h-11 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
