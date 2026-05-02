import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "../../context/AppContext";
import AuthModal from "../ui/AuthModal";

// Desktop text nav links (left side)
const NAV_LINKS = [
  { name: "Home",   page: "home" },
  { name: "Movies", page: "movies" },
  { name: "Series", page: "series" },
  { name: "Anime",  page: "anime" },
  { name: "Gems",   page: "gems" },
];

// SVG icon for Settings (used in right icon row)
const SettingsIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const MODE_CYCLE  = ["indian", "mixed", "hollywood"];
const MODE_LABELS = { indian: "🇮🇳 Indian", mixed: "🌍 Mixed", hollywood: "🎬 Hollywood" };

export default function Navbar() {
  const { page, navigate, mode, setMode, accent, activeProvider, setActiveProvider, user, logout } = useApp();
  const [scrolled,    setScrolled]    = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchVal,   setSearchVal]   = useState("");
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [showAuth,    setShowAuth]    = useState(false);
  const searchRef  = useRef(null);
  const debounceRef = useRef(null);

  const accentColor = accent === "orange" ? "#f5a623" : accent === "blue" ? "#2563eb" : accent === "purple" ? "#7c3aed" : "#e50914";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const cycleMode = useCallback(() => {
    const idx  = MODE_CYCLE.indexOf(mode);
    const next = MODE_CYCLE[(idx + 1) % MODE_CYCLE.length];
    setMode(next);
  }, [mode, setMode]);

  const handleSearch = (val) => {
    setSearchVal(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length === 0) {
      debounceRef.current = setTimeout(() => navigate("search", { query: "" }), 400);
      return;
    }
    if (val.trim().length < 2) return;
    debounceRef.current = setTimeout(() => navigate("search", { query: val.trim() }), 400);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) navigate("search", { query: searchVal.trim() });
  };

  const isActive = (p) => page.name === p;

  return (
    <>
      {/* Offline banner */}
      {!navigator.onLine && (
        <div className="fixed top-0 left-0 right-0 z-[9997] py-2 text-center text-sm font-semibold text-white" style={{ background: "#cc0000" }}>
          📡 You are offline. Check your connection.
        </div>
      )}

      <nav
        className="fixed top-0 left-0 right-0 z-[9990] transition-all duration-300"
        style={{
          background: scrolled ? "rgba(0,0,0,0.88)" : "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid var(--border)" : "none",
        }}
      >
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">

          {/* ── Logo ─────────────────────────────────────────── */}
          <button
            onClick={() => navigate("home")}
            className="font-black text-xl md:text-2xl tracking-tighter select-none flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #e50914 0%, #f5a623 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            CINNY
          </button>

          {/* ── Desktop nav links (centre) ───────────────────── */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => (
              <button
                key={link.page}
                onClick={() => navigate(link.page)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 relative"
                style={{ color: isActive(link.page) ? accentColor : "var(--text-secondary)" }}
              >
                {link.name}
                {isActive(link.page) && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                    style={{ background: accentColor }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* ── Right icon group ─────────────────────────────── */}
          <div className="flex items-center gap-2">

            {/* Provider badge — visible when a provider is active */}
            {activeProvider && (
              <button
                onClick={() => setActiveProvider(null)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 animate-pulse"
                style={{
                  background: `${activeProvider.color}22`,
                  border: `1px solid ${activeProvider.color}55`,
                  color: activeProvider.color,
                }}
                title={`${activeProvider.brand} mode — click to exit`}
              >
                {activeProvider.label} ✕
              </button>
            )}

            {/* Mode toggle (hidden when provider active) */}
            {!activeProvider && (
              <button
                onClick={cycleMode}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105"
                style={{
                  background: `${accentColor}22`,
                  border: `1px solid ${accentColor}44`,
                  color: accentColor,
                }}
              >
                {MODE_LABELS[mode]}
              </button>
            )}

            {/* Search */}
            <div className="flex items-center">
              {searchOpen && (
                <form onSubmit={handleSearchSubmit} className="mr-1">
                  <input
                    ref={searchRef}
                    autoFocus
                    type="text"
                    value={searchVal}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search movies, shows..."
                    className="rounded-full text-sm px-3 py-1.5 transition-all duration-300"
                    style={{
                      background: "var(--surface)",
                      border: `1px solid ${accentColor}55`,
                      color: "var(--text-primary)",
                      width: 200,
                    }}
                    onBlur={() => { if (!searchVal) setSearchOpen(false); }}
                  />
                </form>
              )}
              <button
                onClick={() => { setSearchOpen((v) => !v); setTimeout(() => searchRef.current?.focus(), 100); }}
                className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-110"
                style={{ background: "var(--surface)", color: "var(--text-secondary)" }}
                title="Search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
            </div>

            {/* Settings icon (beside search) */}
            <button
              onClick={() => navigate("settings")}
              className="hidden md:flex w-9 h-9 items-center justify-center rounded-full transition-all hover:scale-110"
              style={{
                background: isActive("settings") ? `${accentColor}22` : "var(--surface)",
                color: isActive("settings") ? accentColor : "var(--text-secondary)",
                border: `1px solid ${isActive("settings") ? accentColor : "transparent"}`,
              }}
              title="Settings"
            >
              <SettingsIcon />
            </button>

            {/* Watch Later bookmark */}
            <button
              onClick={() => navigate("watchlater")}
              className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-110"
              style={{ background: "var(--surface)", color: "var(--text-secondary)" }}
              title="Watch Later"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>

            {/* Auth Button */}
            {user ? (
              <button
                onClick={logout}
                className="hidden md:flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105"
                style={{ background: "var(--surface)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                title="Logout"
              >
                {user.username}
              </button>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="hidden md:flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105"
                style={{ background: accentColor, color: "white" }}
              >
                Sign In
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full"
              style={{ background: "var(--surface)" }}
            >
              {mobileOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile Drawer ─────────────────────────────────── */}
        {mobileOpen && (
          <div className="md:hidden border-t" style={{ background: "rgba(0,0,0,0.96)", borderColor: "var(--border)" }}>
            {NAV_LINKS.map((link) => (
              <button
                key={link.page}
                onClick={() => { navigate(link.page); setMobileOpen(false); }}
                className="w-full text-left px-6 py-3 text-sm font-medium border-b"
                style={{ color: isActive(link.page) ? accentColor : "var(--text-primary)", borderColor: "var(--border)" }}
              >
                {link.name}
              </button>
            ))}
            {/* Settings in drawer */}
            <button
              onClick={() => { navigate("settings"); setMobileOpen(false); }}
              className="w-full text-left px-6 py-3 text-sm font-medium border-b flex items-center gap-2"
              style={{ color: isActive("settings") ? accentColor : "var(--text-primary)", borderColor: "var(--border)" }}
            >
              <SettingsIcon /> Settings
            </button>
            {/* Mobile mode toggle */}
            <button
              onClick={() => { cycleMode(); setMobileOpen(false); }}
              className="w-full text-left px-6 py-3 text-sm font-bold border-b"
              style={{ color: accentColor, borderColor: "var(--border)" }}
            >
              Content: {MODE_LABELS[mode]} → Switch
            </button>
            {/* Mobile auth button */}
            {user ? (
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="w-full text-left px-6 py-3 text-sm font-bold flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout ({user.username})
              </button>
            ) : (
              <button
                onClick={() => { setShowAuth(true); setMobileOpen(false); }}
                className="w-full text-left px-6 py-3 text-sm font-bold flex items-center gap-2"
                style={{ color: accentColor }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Sign In
              </button>
            )}
          </div>
        )}
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
