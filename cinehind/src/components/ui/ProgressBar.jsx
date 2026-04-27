import { useApp } from "../../context/AppContext";

export default function ProgressBar() {
  const { progress, isNavigating, accent } = useApp();
  const accentColor = accent === "orange" ? "#f5a623" : accent === "blue" ? "#2563eb" : accent === "purple" ? "#7c3aed" : "#e50914";

  if (!isNavigating && progress === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[10000] h-[3px]" style={{ background: "transparent" }}>
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: accentColor,
          boxShadow: `0 0 8px ${accentColor}`,
          transition: progress === 100 ? "width 0.2s ease, opacity 0.3s ease 0.1s" : "width 0.15s ease",
          opacity: progress >= 100 ? 0 : 1,
          borderRadius: "0 2px 2px 0",
        }}
      />
    </div>
  );
}
