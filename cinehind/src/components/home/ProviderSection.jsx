import { useApp } from "../../context/AppContext";
import { PROVIDERS } from "../../config/providers";

export default function ProviderSection() {
  const { activeProvider, setActiveProvider, navigate, accent } = useApp();
  const accentColor = accent === "orange" ? "#f5a623" : accent === "blue" ? "#2563eb" : accent === "purple" ? "#7c3aed" : "#e50914";

  const handleClick = (provider) => {
    if (activeProvider?.id === provider.id) {
      // Toggle off — go back to normal mode
      setActiveProvider(null);
      navigate("home");
    } else {
      setActiveProvider(provider);
      navigate("home");
    }
  };

  return (
    <div className="px-4 md:px-6 mb-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base md:text-lg font-black" style={{ color: "var(--text-primary)" }}>
            📡 Streaming Providers
          </h2>
          {activeProvider && (
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold animate-pulse"
              style={{ background: `${activeProvider.color}22`, color: activeProvider.color, border: `1px solid ${activeProvider.color}44` }}
            >
              {activeProvider.label} MODE
            </span>
          )}
        </div>
        {activeProvider && (
          <button
            onClick={() => { setActiveProvider(null); navigate("home"); }}
            className="text-xs font-semibold transition-all hover:scale-105"
            style={{ color: "var(--text-secondary)" }}
          >
            ✕ Clear filter
          </button>
        )}
      </div>

      {/* Provider cards — horizontal scroll */}
      <div className="flex gap-4 overflow-x-auto scroll-row pt-3 pb-6 pr-6 pl-2 -ml-2">
        {PROVIDERS.map((p) => {
          const isActive = activeProvider?.id === p.id;
          return (
              <button
                key={p.id}
                onClick={() => handleClick(p)}
                className={`provider-card ${isActive ? "active" : ""}`}
                style={{ "--provider-color": p.color }}
                title={`${p.label} — ${p.brand}`}
              >
                <span className="provider-emoji">{p.emoji}</span>
                <span className="provider-label">{p.label}</span>
              </button>
            );
          })}
        </div>

      {/* Active provider banner */}
      {activeProvider && (
        <div className="provider-active-banner">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm flex-shrink-0"
            style={{ background: activeProvider.bg, fontSize: 12 }}
          >
            {activeProvider.emoji}
          </div>
          <div>
            <p className="font-black" style={{ color: activeProvider.color }}>
              {activeProvider.label}
            </p>
            <p className="text-xs">
              Showing only {activeProvider.brand} content across Movies, Series & Anime
            </p>
          </div>
          <button
            onClick={() => { setActiveProvider(null); navigate("home"); }}
            className="ml-auto text-xs px-3 py-1 rounded-full font-semibold transition-all hover:scale-105"
            style={{ background: `${activeProvider.color}22`, color: activeProvider.color, border: `1px solid ${activeProvider.color}44` }}
          >
            Exit
          </button>
        </div>
      )}
    </div>
  );
}
