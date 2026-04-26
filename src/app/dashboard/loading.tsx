export default function DashboardLoading() {
  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-5xl mx-auto">

      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-4 w-48 bg-gray-100 rounded-lg animate-pulse" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6 space-y-3">
            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 w-16 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Ações rápidas skeleton */}
      <div>
        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-[20px] animate-pulse" />
          ))}
        </div>
      </div>

      {/* Lista skeleton */}
      <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-3 w-36 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-3 w-10 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
