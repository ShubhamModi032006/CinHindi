import { useApp } from "../../context/AppContext";

export default function ToastContainer() {
  const { toasts, accent } = useApp();

  const accentColor = accent === "orange" ? "#f5a623" : accent === "blue" ? "#2563eb" : accent === "purple" ? "#7c3aed" : "#e50914";

  return (
    <div className="fixed bottom-6 right-4 z-[9998] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-enter pointer-events-auto px-4 py-3 rounded-xl text-white text-sm font-medium shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor}99)`,
            backdropFilter: "blur(12px)",
            border: `1px solid ${accentColor}44`,
            maxWidth: 280,
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
