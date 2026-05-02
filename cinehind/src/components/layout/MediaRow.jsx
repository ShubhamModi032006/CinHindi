import { useRef, useState, useEffect } from "react";
import MediaCard from "../ui/MediaCard";
import { CardSkeleton } from "../ui/Skeletons";

export default function MediaRow({
  title,
  items = [],
  loading = false,
  type = "movie",
  cardWidth = 160,
  className = "",
  dismissable = false,
  showRank = false,
}) {
  const scrollRef = useRef(null);

  // Local copy of items so dismiss can remove cards instantly
  const [localItems, setLocalItems] = useState(items);
  useEffect(() => { setLocalItems(items); }, [items]);

  const handleDismiss = (id) => {
    setLocalItems((prev) => prev.filter((item) => item.id !== id));
  };

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * (cardWidth + 12) * 3, behavior: "smooth" });
  };

  return (
    <div className={`mb-10 ${className}`}>
      {/* Row title */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-6">
        <h2 className="text-base md:text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h2>
      </div>

      {/* Scroll container with arrows */}
      <div className="relative group">
        {/* Left arrow */}
        <button
          onClick={() => scroll(-1)}
          className="absolute left-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "linear-gradient(to right, rgba(0,0,0,0.8), transparent)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {/* Cards */}
        <div ref={scrollRef} className="scroll-row flex gap-3 px-4 md:px-6 pb-2">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
            : localItems.map((item, i) => (
              <div key={`${item.id}-${i}`} className="card-anim" style={{ animationDelay: `${i * 50}ms`, position: "relative" }}>
                <MediaCard
                  item={item}
                  index={i}
                  type={type}
                  width={cardWidth}
                  onDismiss={dismissable ? handleDismiss : undefined}
                />
                {showRank && i < 10 && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: -4,
                      left: -6,
                      fontSize: "4rem",
                      fontWeight: 900,
                      lineHeight: 1,
                      color: "white",
                      textShadow: "2px 2px 8px rgba(0,0,0,0.9), -1px -1px 4px rgba(0,0,0,0.7)",
                      WebkitTextStroke: "1.5px rgba(0,0,0,0.5)",
                      pointerEvents: "none",
                      userSelect: "none",
                      zIndex: 5,
                      fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    }}
                  >
                    {item.jwRank || i + 1}
                  </span>
                )}
              </div>
            ))
          }
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll(1)}
          className="absolute right-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "linear-gradient(to left, rgba(0,0,0,0.8), transparent)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
