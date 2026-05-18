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
  const rowRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('row-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const el = rowRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

  const cleanTitle = title.replace(/[🔥🎬📺🏆🆕⭐✨🎭🌐]/g, '').trim();

  return (
    <div ref={rowRef} className={`media-row mb-10 ${className}`}>
      {/* Row title */}
      <div className="row-header">
        <h2 className="row-title">
          {cleanTitle}
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
              <div key={`${item.id}-${i}`} className="flex items-center shrink-0" style={{ position: "relative" }}>
                {showRank && i < 10 && (
                  <span
                    className="select-none"
                    style={{
                      fontSize: "8rem",
                      fontWeight: 900,
                      lineHeight: 0.8,
                      letterSpacing: "-0.05em",
                      color: "black",
                      WebkitTextStroke: "2px #555",
                      marginRight: "-25px",
                      zIndex: 0,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {item.jwRank || i + 1}
                  </span>
                )}
                <div style={{ zIndex: 1, position: "relative", animationDelay: `${i * 60}ms` }} className="card-anim">
                  <MediaCard
                    item={item}
                    index={i}
                    type={type}
                    width={cardWidth}
                    onDismiss={dismissable ? handleDismiss : undefined}
                  />
                </div>
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
