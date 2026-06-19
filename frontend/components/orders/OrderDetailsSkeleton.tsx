export default function OrderDetailsSkeleton() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 animate-pulse">
      {/* Back link */}
      <div className="h-4 bg-gray-200 rounded w-28 mb-6" />

      <div className="flex gap-8">
        {/* Left column */}
        <div className="flex-1 min-w-0">
          {/* Service section */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
            <div className="flex gap-4">
              <div className="w-24 h-20 bg-gray-200 rounded-lg shrink-0" />
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-40 mb-1.5" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            </div>
          </div>

          {/* Order info */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
            <div className="h-5 bg-gray-200 rounded w-36 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i}>
                  <div className="h-3 bg-gray-200 rounded w-20 mb-1.5" />
                  <div className="h-4 bg-gray-200 rounded w-32" />
                </div>
              ))}
            </div>
          </div>

          {/* Participants */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
            <div className="h-5 bg-gray-200 rounded w-28 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div>
                    <div className="h-3 bg-gray-200 rounded w-16 mb-1.5" />
                    <div className="h-4 bg-gray-200 rounded w-28" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Address */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
            <div className="h-5 bg-gray-200 rounded w-20 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-64 mb-2" />
            <div className="w-full h-40 bg-gray-200 rounded-lg" />
          </div>

          {/* Timeline */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
            <div className="h-5 bg-gray-200 rounded w-32 mb-5" />
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-3 h-3 bg-gray-200 rounded-full" />
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-36" />
                    <div className="h-3 bg-gray-200 rounded w-24 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-[340px] shrink-0 hidden lg:block">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="h-3 bg-gray-200 rounded w-24 mb-2.5" />
              <div className="h-6 bg-gray-200 rounded-full w-32" />
            </div>
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-4/5 mt-1.5" />
            </div>
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-28" />
            </div>
            <div className="px-6 py-5 space-y-2.5">
              <div className="h-10 bg-gray-200 rounded-lg" />
              <div className="h-10 bg-gray-200 rounded-lg" />
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="h-10 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
