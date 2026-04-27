import { useState } from "react";
import { useApp } from "../context/AppContext";
import { ACCENTS } from "../config/constants";

const ACCENT_LIST = [
  { key: "red", color: "#e50914", label: "Red" },
  { key: "orange", color: "#f5a623", label: "Orange" },
  { key: "blue", color: "#2563eb", label: "Blue" },
  { key: "purple", color: "#7c3aed", label: "Purple" },
];

const THEME_LIST = [
  { key: "amoled", label: "AMOLED Black", desc: "Pure black #000000", swatch: "#000" },
  { key: "dark", label: "Dark", desc: "Soft dark #0a0a0a", swatch: "#0a0a0a" },
  { key: "light", label: "Light", desc: "Clean white/grey", swatch: "#f5f5f5" },
];

export default function SettingsPage() {
  const {
    theme, setTheme,
    accent, setAccent,
    mode, setMode,
    autoplay, setAutoplay,
    clearHistory, clearContinueWatching,
    showToast,
  } = useApp();

  const accentColor = accent === "orange" ? "#f5a623" : accent === "blue" ? "#2563eb" : accent === "purple" ? "#7c3aed" : "#e50914";
  const [confirmHistory, setConfirmHistory] = useState(false);
  const [confirmContinue, setConfirmContinue] = useState(false);

  const handleChange = (fn, ...args) => {
    fn(...args);
    showToast("✓ Settings saved");
  };

  const Section = ({ title, children }) => (
    <div className="mb-8 rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <h2 className="font-bold text-sm" style={{ color: accentColor }}>{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );

  return (
    <div className="page-enter pt-24 px-4 md:px-6 max-w-2xl mx-auto" style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
          ⚙️ Settings
          <span className="inline-block ml-3" style={{ width: 60, height: 3, background: accentColor, verticalAlign: "middle", borderRadius: 2 }} />
        </h1>
      </div>

      {/* Appearance */}
      <Section title="🎨 Appearance">
        {/* Theme */}
        <div className="mb-6">
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Theme</p>
          <div className="flex flex-col gap-2">
            {THEME_LIST.map((t) => (
              <label
                key={t.key}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
                style={{
                  background: theme === t.key ? `${accentColor}18` : "var(--card)",
                  border: `1px solid ${theme === t.key ? accentColor : "var(--border)"}`,
                }}
              >
                <input
                  type="radio"
                  name="theme"
                  checked={theme === t.key}
                  onChange={() => handleChange(setTheme, t.key)}
                  className="hidden"
                />
                <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: t.swatch, border: "2px solid #444" }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t.label}</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{t.desc}</p>
                </div>
                {theme === t.key && (
                  <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ background: accentColor }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div>
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Accent Color</p>
          <div className="flex gap-4">
            {ACCENT_LIST.map((a) => (
              <button
                key={a.key}
                onClick={() => handleChange(setAccent, a.key)}
                className="flex flex-col items-center gap-1.5 transition-all hover:scale-110"
              >
                <div
                  className="w-10 h-10 rounded-full transition-all"
                  style={{
                    background: a.color,
                    outline: accent === a.key ? `3px solid white` : "3px solid transparent",
                    outlineOffset: 2,
                    boxShadow: accent === a.key ? `0 0 12px ${a.color}88` : "none",
                  }}
                />
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Content Preferences */}
      <Section title="🌍 Content Preferences">
        <div>
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Default Content Mode</p>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "indian", label: "🇮🇳 Indian" },
              { value: "mixed", label: "🌍 Mixed" },
              { value: "hollywood", label: "🎬 Hollywood" },
            ].map((m) => (
              <button
                key={m.value}
                onClick={() => handleChange(setMode, m.value)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
                style={{
                  background: mode === m.value ? accentColor : "var(--card)",
                  color: mode === m.value ? "white" : "var(--text-secondary)",
                  border: `1px solid ${mode === m.value ? accentColor : "var(--border)"}`,
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Playback */}
      <Section title="▶ Playback">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Autoplay Next Episode</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Shows countdown when episode ends
            </p>
          </div>
          <button
            onClick={() => handleChange(setAutoplay, !autoplay)}
            className="relative w-12 h-6 rounded-full transition-all"
            style={{ background: autoplay ? accentColor : "var(--border)" }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300"
              style={{ left: autoplay ? 26 : 2 }}
            />
          </button>
        </div>
      </Section>

      {/* Data */}
      <Section title="🗑 Data">
        {/* Clear Watch History */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Watch History</p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Clear all watched content history</p>
          </div>
          {confirmHistory ? (
            <div className="flex gap-2">
              <button
                onClick={() => { clearHistory(); setConfirmHistory(false); }}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-white"
                style={{ background: "#cc0000" }}
              >
                Clear
              </button>
              <button
                onClick={() => setConfirmHistory(false)}
                className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: "var(--border)", color: "var(--text-primary)" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmHistory(true)}
              className="px-4 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105"
              style={{ background: "var(--card)", border: "1px solid #cc000044", color: "#cc0000" }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Clear Continue Watching */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Continue Watching</p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Remove all resume progress</p>
          </div>
          {confirmContinue ? (
            <div className="flex gap-2">
              <button
                onClick={() => { clearContinueWatching(); setConfirmContinue(false); }}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-white"
                style={{ background: "#cc0000" }}
              >
                Remove
              </button>
              <button
                onClick={() => setConfirmContinue(false)}
                className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: "var(--border)", color: "var(--text-primary)" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmContinue(true)}
              className="px-4 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105"
              style={{ background: "var(--card)", border: "1px solid #cc000044", color: "#cc0000" }}
            >
              Clear
            </button>
          )}
        </div>
      </Section>

      <div style={{ height: 60 }} />
    </div>
  );
}
