import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate as useRouterNavigate, useLocation } from "react-router-dom";
import { LS, THEMES, ACCENTS } from "../config/constants";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // ── Theme & Accent ──────────────────────────────────────
  const [theme, setThemeState] = useState(() => localStorage.getItem(LS.THEME) || "amoled");
  const [accent, setAccentState] = useState(() => localStorage.getItem(LS.ACCENT) || "red");

  // ── Content Mode ─────────────────────────────────────────
  const [mode, setModeState] = useState(() => localStorage.getItem(LS.MODE) || "indian");

  // ── Active Streaming Provider (null = all content) ────────
  const [activeProvider, setActiveProvider] = useState(null);

  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // ── Auth ──────────────────────────────────────────────────
  const [token, setToken] = useState(() => localStorage.getItem("auth_token") || null);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("auth_user")) || null; }
    catch { return null; }
  });

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("auth_user", JSON.stringify(newUser));
  };

  const register = login; // same logic

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setWatchLater([]);
    setContinueWatching([]);
    setWatchHistory([]);
  };

  // ── Settings ─────────────────────────────────────────────
  const [autoplay, setAutoplayState] = useState(() => localStorage.getItem(LS.AUTOPLAY) !== "false");

  // ── Watch Later ──────────────────────────────────────────
  const [watchLater, setWatchLater] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS.WATCH_LATER)) || []; }
    catch { return []; }
  });

  // ── Continue Watching ─────────────────────────────────────
  const [continueWatching, setContinueWatching] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS.CONTINUE_WATCHING)) || []; }
    catch { return []; }
  });

  // ── Toast ─────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // ── Navigation ────────────────────────────────────────────
  const [page, setPage] = useState({ name: "home", params: {} });
  const [progress, setProgress] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const progressTimer = useRef(null);

  // ── Apply CSS variables ───────────────────────────────────
  useEffect(() => {
    const t = THEMES[theme] || THEMES.amoled;
    const a = ACCENTS[accent] || ACCENTS.red;
    const root = document.documentElement;
    root.style.setProperty("--bg", t.bg);
    root.style.setProperty("--card", t.card);
    root.style.setProperty("--surface", t.surface);
    root.style.setProperty("--border", t.border);
    root.style.setProperty("--text-primary", t.textPrimary);
    root.style.setProperty("--text-secondary", t.textSecondary);
    root.style.setProperty("--accent", a);
    // body class for light mode text
    document.body.className = theme === "light" ? "light-theme" : "dark-theme";
  }, [theme, accent]);

  // ── Persist helpers ───────────────────────────────────────
  const setTheme = (v) => {
    setThemeState(v);
    localStorage.setItem(LS.THEME, v);
  };
  const setAccent = (v) => {
    setAccentState(v);
    localStorage.setItem(LS.ACCENT, v);
  };
  const setMode = (v) => {
    setModeState(v);
    localStorage.setItem(LS.MODE, v);
  };
  const setAutoplay = (v) => {
    setAutoplayState(v);
    localStorage.setItem(LS.AUTOPLAY, v ? "true" : "false");
  };

  // ── Toast ─────────────────────────────────────────────────
  const showToast = useCallback((message) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  const routerNavigate = useRouterNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let name = "home";
    if (path.startsWith("/movies")) name = "movies";
    else if (path.startsWith("/series")) name = "series";
    else if (path.startsWith("/anime")) name = "anime";
    else if (path.startsWith("/gems")) name = "gems";
    else if (path.startsWith("/detail")) name = "detail";
    else if (path.startsWith("/watchlater")) name = "watchlater";
    else if (path.startsWith("/watch")) name = "watch";
    else if (path.startsWith("/settings")) name = "settings";
    else if (path.startsWith("/search")) name = "search";
    else if (path.startsWith("/genre")) name = "genre";
    
    // Update the state to keep Navbar highlighting working
    setPage((prev) => prev.name === name ? prev : { name, params: prev.params });
  }, [location.pathname]);

  // ── Navigation with progress bar ─────────────────────────
  const navigate = useCallback((name, params = {}) => {
    let path = "/";
    if (name === "home") path = "/";
    else if (name === "movies") path = "/movies";
    else if (name === "series") path = "/series";
    else if (name === "anime") path = "/anime";
    else if (name === "gems") path = "/gems";
    else if (name === "detail") path = `/detail/${params.type}/${params.id}`;
    else if (name === "watch") {
      path = `/watch/${params.type}/${params.id}`;
      const sp = new URLSearchParams();
      if (params.season) sp.set("season", params.season);
      if (params.episode) sp.set("episode", params.episode);
      if (params.title) sp.set("title", params.title);
      if (params.poster) sp.set("poster", params.poster);
      if (sp.toString()) path += `?${sp.toString()}`;
    }
    else if (name === "settings") path = "/settings";
    else if (name === "search") {
      path = `/search`;
      const query = params.q || params.query;
      if (query) path += `?q=${encodeURIComponent(query)}`;
    }
    else if (name === "genre") {
      path = `/genre/${params.genreId}`;
      if (params.genreName) path += `?name=${encodeURIComponent(params.genreName)}`;
    }
    else if (name === "watchlater") path = "/watchlater";

    setIsNavigating(true);
    setProgress(0);
    if (progressTimer.current) clearInterval(progressTimer.current);
    let p = 0;
    progressTimer.current = setInterval(() => {
      p += Math.random() * 15 + 5;
      if (p >= 85) { clearInterval(progressTimer.current); p = 85; }
      setProgress(p);
    }, 100);
    setTimeout(() => {
      clearInterval(progressTimer.current);
      setProgress(100);
      setPage({ name, params });
      routerNavigate(path);
      setTimeout(() => {
        setProgress(0);
        setIsNavigating(false);
      }, 400);
    }, 400);
  }, [routerNavigate]);

  // ── Watch Later ───────────────────────────────────────────
  const toggleWatchLater = useCallback(async (item) => {
    setWatchLater((prev) => {
      const exists = prev.some((i) => i.id === item.id && i.type === item.type);
      let next;
      if (exists) {
        next = prev.filter((i) => !(i.id === item.id && i.type === item.type));
        showToast("Removed from Watch Later");
      } else {
        next = [{ id: item.id, type: item.type, title: item.title, poster: item.poster }, ...prev];
        showToast("✓ Added to Watch Later");
      }
      if (!token) localStorage.setItem(LS.WATCH_LATER, JSON.stringify(next));
      return next;
    });

    if (token) {
      try {
        await fetch(`${API_URL}/api/watchlater`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ item_id: item.id, item_type: item.type, title: item.title, poster: item.poster })
        });
      } catch (err) { console.error("Sync error", err); }
    }
  }, [showToast, token]);

  const isInWatchLater = useCallback((id, type) => {
    return watchLater.some((i) => i.id === id && i.type === type);
  }, [watchLater]);

  // ── Continue Watching ─────────────────────────────────────
  const saveContinueWatching = useCallback(async (item) => {
    setContinueWatching((prev) => {
      const filtered = prev.filter((i) => !(i.id === item.id && i.type === item.type));
      const next = [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, 20);
      if (!token) localStorage.setItem(LS.CONTINUE_WATCHING, JSON.stringify(next));
      return next;
    });

    if (token) {
      try {
        await fetch(`${API_URL}/api/continuewatching`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ item_id: item.id, item_type: item.type, title: item.title, poster: item.poster, season: item.season, episode: item.episode })
        });
      } catch (err) { console.error("Sync error", err); }
    }
  }, [token]);

  const removeContinueWatching = useCallback(async (id, type) => {
    setContinueWatching((prev) => {
      const next = prev.filter((i) => !(i.id === id && i.type === type));
      if (!token) localStorage.setItem(LS.CONTINUE_WATCHING, JSON.stringify(next));
      return next;
    });
    showToast("Removed from Continue Watching");

    if (token) {
      try {
        await fetch(`${API_URL}/api/continuewatching/${id}/${type}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
      } catch (err) { console.error("Sync error", err); }
    }
  }, [showToast, token]);

  const clearContinueWatching = useCallback(async () => {
    setContinueWatching([]);
    if (!token) localStorage.removeItem(LS.CONTINUE_WATCHING);
    showToast("Continue Watching cleared");

    if (token) {
      try {
        await fetch(`${API_URL}/api/continuewatching`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      } catch (err) { console.error("Sync error", err); }
    }
  }, [showToast, token]);

  // ── Watch History ─────────────────────────────────────────
  const [watchHistory, setWatchHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS.WATCH_HISTORY)) || []; }
    catch { return []; }
  });

  const addToHistory = useCallback(async (item) => {
    setWatchHistory((prev) => {
      const filtered = prev.filter((i) => !(i.id === item.id && i.type === item.type));
      const next = [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, 100);
      if (!token) localStorage.setItem(LS.WATCH_HISTORY, JSON.stringify(next));
      return next;
    });

    if (token) {
      try {
        await fetch(`${API_URL}/api/history`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ item_id: item.id, item_type: item.type, title: item.title, poster: item.poster })
        });
      } catch (err) { console.error("Sync error", err); }
    }
  }, [token]);

  const clearHistory = useCallback(async () => {
    setWatchHistory([]);
    if (!token) localStorage.removeItem(LS.WATCH_HISTORY);
    showToast("Watch history cleared");

    if (token) {
      try {
        await fetch(`${API_URL}/api/history`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      } catch (err) { console.error("Sync error", err); }
    }
  }, [showToast, token]);

  // Initial Fetch when token changes
  useEffect(() => {
    if (!token) return;
    const fetchUserData = async () => {
      try {
        const [histRes, wlRes, cwRes] = await Promise.all([
          fetch(`${API_URL}/api/history`, { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(`${API_URL}/api/watchlater`, { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(`${API_URL}/api/continuewatching`, { headers: { "Authorization": `Bearer ${token}` } })
        ]);
        if (histRes.ok) { const data = await histRes.json(); setWatchHistory(data.map(d => ({ ...d, id: d.item_id, type: d.item_type }))); }
        if (wlRes.ok) { const data = await wlRes.json(); setWatchLater(data.map(d => ({ ...d, id: d.item_id, type: d.item_type }))); }
        if (cwRes.ok) { const data = await cwRes.json(); setContinueWatching(data.map(d => ({ ...d, id: d.item_id, type: d.item_type }))); }
      } catch (err) { console.error("Failed to fetch user data", err); }
    };
    fetchUserData();
  }, [token]);

  return (
    <AppContext.Provider value={{
      theme, setTheme,
      accent, setAccent,
      mode, setMode,
      activeProvider, setActiveProvider,
      autoplay, setAutoplay,
      watchLater, toggleWatchLater, isInWatchLater,
      continueWatching, saveContinueWatching, removeContinueWatching, clearContinueWatching,
      watchHistory, addToHistory, clearHistory,
      toasts, showToast,
      page, navigate,
      progress, isNavigating,
      user, token, login, logout, register,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
