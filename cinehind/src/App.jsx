import { useState, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { LS } from "./config/constants";

// UI
import IntroLoader from "./components/ui/IntroLoader";
import ToastContainer from "./components/ui/ToastContainer";
import ProgressBar from "./components/ui/ProgressBar";
import Navbar from "./components/layout/Navbar";

// Pages
import HomePage from "./pages/HomePage";
import MoviesPage from "./pages/MoviesPage";
import SeriesPage from "./pages/SeriesPage";
import AnimePage from "./pages/AnimePage";
import HiddenGemsPage from "./pages/HiddenGemsPage";
import DetailPage from "./pages/DetailPage";
import WatchPage from "./pages/WatchPage";
import SettingsPage from "./pages/SettingsPage";
import SearchPage from "./pages/SearchPage";
import GenrePage from "./pages/GenrePage";
import WatchLaterPage from "./pages/WatchLaterPage";

import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// Router component
function AppRouter() {
  const location = useLocation();
  const isWatch = location.pathname.startsWith("/watch/");

  if (isWatch) {
    return (
      <div style={{ background: "#000", minHeight: "100vh" }}>
        <Routes>
          <Route path="/watch/:type/:id" element={<WatchPage />} />
        </Routes>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/series" element={<SeriesPage />} />
          <Route path="/anime" element={<AnimePage />} />
          <Route path="/gems" element={<HiddenGemsPage />} />
          <Route path="/detail/:type/:id" element={<DetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/genre/:genreId" element={<GenrePage />} />
          <Route path="/watchlater" element={<WatchLaterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AppShell() {
  const alreadySeen = !!localStorage.getItem(LS.INTRO_SHOWN);
  const [showIntro, setShowIntro] = useState(!alreadySeen);

  // Safety fallback: if intro somehow gets stuck, dismiss after 4s
  useEffect(() => {
    if (!showIntro) return;
    const t = setTimeout(() => {
      localStorage.setItem(LS.INTRO_SHOWN, "true");
      setShowIntro(false);
    }, 4000);
    return () => clearTimeout(t);
  }, [showIntro]);

  const handleIntroDone = () => {
    localStorage.setItem(LS.INTRO_SHOWN, "true");
    setShowIntro(false);
  };

  return (
    <>
      {/* Main content ALWAYS rendered — intro overlays on top */}
      <AppRouter />

      {/* Intro overlays on first visit only */}
      {showIntro && <IntroLoader onDone={handleIntroDone} />}

      <ToastContainer />
      <ProgressBar />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
