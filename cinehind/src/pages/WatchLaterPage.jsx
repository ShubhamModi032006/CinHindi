import { useApp } from "../context/AppContext";
import MediaCard from "../components/ui/MediaCard";

export default function WatchLaterPage() {
  const { watchLater, navigate, accent } = useApp();
  const accentColor = accent === "orange" ? "#f5a623" : accent === "blue" ? "#2563eb" : accent === "purple" ? "#7c3aed" : "#e50914";

  return (
    <div className="page-enter pt-24 px-4 md:px-6" style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
            🔖 Watch Later
            <span className="inline-block ml-3" style={{ width: 60, height: 3, background: accentColor, verticalAlign: "middle", borderRadius: 2 }} />
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{watchLater.length} saved</p>
        </div>
        <button
          onClick={() => navigate("home")}
          className="flex items-center gap-1.5 text-sm transition-all hover:scale-105"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>
      </div>

      {watchLater.length === 0 ? (
        <div className="flex flex-col items-center py-24 gap-4">
          <div style={{ fontSize: 72 }}>🔖</div>
          <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Nothing saved yet</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Tap the bookmark icon on any card to save it here</p>
          <button
            onClick={() => navigate("home")}
            className="mt-4 px-6 py-3 rounded-full font-bold text-white text-sm transition-all hover:scale-105"
            style={{ background: accentColor }}
          >
            Browse Content
          </button>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
          {watchLater.map((item, i) => (
            <div key={`${item.id}-${item.type}`} className="card-anim" style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}>
              <MediaCard
                item={{ id: item.id, title: item.title, poster_path: item.poster }}
                index={i}
                type={item.type}
                width="100%"
              />
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 60 }} />
    </div>
  );
}
