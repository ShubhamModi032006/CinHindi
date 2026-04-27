import { useState, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { fetchTmdb } from "../hooks/useTmdb";
import { MODE_LANGUAGES } from "../config/tmdb";
import MediaCard from "../components/ui/MediaCard";
import { GridSkeleton } from "../components/ui/Skeletons";

const TABS = [
  {
    id: "hidden",
    label: "🔍 Hidden Gems",
    subtitle: "High rating, low hype",
    params: { "vote_average.gte": 7.5, "vote_count.gte": 200, "vote_count.lte": 5000, sort_by: "vote_average.desc" },
  },
  {
    id: "classics",
    label: "💎 Underrated Classics",
    subtitle: "Old gold you probably missed",
    params: { "primary_release_date.lte": "2015-01-01", "vote_average.gte": 7.8, "vote_count.gte": 500, sort_by: "vote_average.desc" },
  },
  {
    id: "acclaimed",
    label: "🌶️ Critically Acclaimed",
    subtitle: "Critics loved it, world ignored it",
    params: { "vote_average.gte": 8.0, "vote_count.gte": 100, "vote_count.lte": 3000, sort_by: "vote_average.desc" },
  },
];

const LANGUAGE_OPTS = [
  { label: "All", value: "" },
  { label: "Hindi", value: "hi" },
  { label: "Tamil", value: "ta" },
  { label: "Telugu", value: "te" },
  { label: "Malayalam", value: "ml" },
  { label: "English", value: "en" },
];

const GENRE_OPTS = [
  { label: "All", value: "" },
  { label: "Drama", value: "18" },
  { label: "Thriller", value: "53" },
  { label: "Crime", value: "80" },
  { label: "Action", value: "28" },
  { label: "Comedy", value: "35" },
];

export default function HiddenGemsPage() {
  const { mode, accent } = useApp();
  const goldColor = "#f5a623";
  const accentColor = accent === "orange" ? "#f5a623" : accent === "blue" ? "#2563eb" : accent === "purple" ? "#7c3aed" : "#e50914";
  const defaultLang = MODE_LANGUAGES[mode];

  const [activeTab, setActiveTab] = useState("hidden");
  const [lang, setLang] = useState("");
  const [genre, setGenre] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fadeContent, setFadeContent] = useState(true);

  const currentTab = TABS.find((t) => t.id === activeTab);

  const fetchGems = useCallback(async (pg = 1, reset = true) => {
    if (reset) { setLoading(true); setItems([]); }
    else setLoadingMore(true);
    try {
      const params = {
        ...currentTab.params,
        page: pg,
        with_original_language: lang || defaultLang,
      };
      if (genre) params.with_genres = genre;
      const d = await fetchTmdb("/discover/movie", params);
      const results = d.results || [];
      if (reset) setItems(results);
      else setItems((prev) => [...prev, ...results]);
      setHasMore(pg < (d.total_pages || 1));
    } catch {
      if (reset) setItems([]);
    }
    if (reset) setLoading(false);
    else setLoadingMore(false);
  }, [activeTab, lang, genre, defaultLang, currentTab]);

  useEffect(() => {
    setFadeContent(false);
    setPage(1);
    setTimeout(() => {
      setFadeContent(true);
      fetchGems(1, true);
    }, 150);
  }, [activeTab, lang, genre, mode]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchGems(next, false);
  };

  const switchTab = (id) => {
    setFadeContent(false);
    setTimeout(() => { setActiveTab(id); }, 100);
  };

  const FilterBtn = ({ value, current, onChange, label }) => (
    <button
      onClick={() => onChange(value)}
      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105"
      style={{
        background: current === value ? goldColor : "var(--surface)",
        color: current === value ? "#000" : "var(--text-secondary)",
        border: `1px solid ${current === value ? goldColor : "var(--border)"}`,
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="page-enter pt-24 px-4 md:px-6" style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black" style={{ color: goldColor }}>
          💎 Hidden Gems
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Great content nobody talks about
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105 relative"
            style={{
              color: activeTab === t.id ? goldColor : "var(--text-secondary)",
              background: activeTab === t.id ? `${goldColor}18` : "var(--surface)",
              border: `1px solid ${activeTab === t.id ? goldColor : "var(--border)"}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {currentTab && (
        <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>{currentTab.subtitle}</p>
      )}

      {/* Secondary Filters */}
      <div className="space-y-3 mb-6">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-semibold self-center" style={{ color: "var(--text-secondary)" }}>Language:</span>
          {LANGUAGE_OPTS.map((o) => <FilterBtn key={o.value} value={o.value} current={lang} onChange={setLang} label={o.label} />)}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-semibold self-center" style={{ color: "var(--text-secondary)" }}>Genre:</span>
          {GENRE_OPTS.map((o) => <FilterBtn key={o.value} value={o.value} current={genre} onChange={setGenre} label={o.label} />)}
        </div>
      </div>

      {/* Content */}
      <div style={{ opacity: fadeContent ? 1 : 0, transition: "opacity 0.2s ease" }}>
        {loading ? (
          <GridSkeleton count={15} />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-24 gap-4">
            <div style={{ fontSize: 64 }}>💎</div>
            <p className="text-lg font-semibold" style={{ color: "var(--text-secondary)" }}>No hidden gems found</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
              {items.map((item, i) => (
                <div key={`${item.id}-${i}`} className="card-anim" style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}>
                  <MediaCard item={item} index={i} type="movie" width="100%" />
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8 mb-12">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 rounded-full font-bold text-sm transition-all hover:scale-105 disabled:opacity-60"
                  style={{ background: goldColor, color: "#000" }}
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
