export default function LoadingSkeleton({ message = "Claude is preparing your content..." }: { message?: string }) {
  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                backgroundColor: "#c9a84c",
                animationDelay: `${i * 150}ms`,
              }}
            />
          ))}
        </div>
        <p className="text-slate-500 text-sm">{message}</p>
      </div>

      {/* Skeleton blocks */}
      <div className="skeleton h-8 rounded-lg w-3/4" />
      <div className="skeleton h-4 rounded w-full" />
      <div className="skeleton h-4 rounded w-5/6" />
      <div className="skeleton h-4 rounded w-4/6" />

      <div className="skeleton h-8 rounded-lg w-2/3 mt-6" />
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="skeleton h-10 rounded-none" style={{ backgroundColor: "#1a274420" }} />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-10 rounded-none mt-0.5" />
        ))}
      </div>

      <div className="skeleton h-8 rounded-lg w-1/2 mt-6" />
      <div className="skeleton h-4 rounded w-full" />
      <div className="skeleton h-4 rounded w-4/5" />
      <div className="skeleton h-4 rounded w-3/4" />
    </div>
  );
}
