// Card Skeleton
export function CardSkeleton() {
  return (
    <div className="flex-shrink-0" style={{ width: 160 }}>
      <div className="skeleton rounded-lg" style={{ width: 160, height: 240 }} />
      <div className="skeleton rounded mt-2" style={{ height: 14, width: "80%" }} />
      <div className="skeleton rounded mt-1" style={{ height: 12, width: "50%" }} />
    </div>
  );
}

// Row of card skeletons
export function RowSkeleton({ count = 6 }) {
  return (
    <div className="mb-10">
      <div className="skeleton rounded mb-4" style={{ height: 20, width: 200 }} />
      <div className="flex gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Hero skeleton
export function HeroSkeleton() {
  return (
    <div
      className="skeleton relative w-full"
      style={{ height: "100vh", borderRadius: 0 }}
    >
      <div className="absolute bottom-20 left-12">
        <div className="skeleton rounded" style={{ height: 40, width: 400 }} />
        <div className="skeleton rounded mt-3" style={{ height: 18, width: 300 }} />
        <div className="skeleton rounded mt-2" style={{ height: 18, width: 250 }} />
        <div className="flex gap-3 mt-6">
          <div className="skeleton rounded-full" style={{ height: 44, width: 140 }} />
          <div className="skeleton rounded-full" style={{ height: 44, width: 140 }} />
        </div>
      </div>
    </div>
  );
}

// Grid of card skeletons
export function GridSkeleton({ count = 15 }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="skeleton rounded-lg" style={{ width: "100%", aspectRatio: "2/3" }} />
          <div className="skeleton rounded mt-2" style={{ height: 14, width: "80%" }} />
          <div className="skeleton rounded mt-1" style={{ height: 12, width: "50%" }} />
        </div>
      ))}
    </div>
  );
}
