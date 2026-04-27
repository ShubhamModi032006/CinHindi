import { useEffect, useRef, useState } from "react";
import { useApp } from "../../context/AppContext";

export default function IntroLoader({ onDone }) {
  const { accent } = useApp();
  const [phase, setPhase] = useState("in"); // in | pulse | out
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    const t1 = setTimeout(() => setPhase("pulse"), 600);
    const t2 = setTimeout(() => setPhase("out"), 2000);
    const t3 = setTimeout(() => onDone(), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  const accentColor = accent === "orange" ? "#f5a623" : accent === "blue" ? "#2563eb" : accent === "purple" ? "#7c3aed" : "#e50914";

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ backgroundColor: "#000000" }}
    >
      {/* Particle glow rings */}
      <div
        className="absolute"
        style={{
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
          opacity: phase === "pulse" ? 1 : 0,
          transition: "opacity 0.6s ease",
        }}
      />
      <div
        className="absolute"
        style={{
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}11 0%, transparent 70%)`,
          opacity: phase === "pulse" ? 1 : 0,
          transition: "opacity 0.8s ease",
        }}
      />

      {/* Logo */}
      <div
        className={phase === "out" ? "logo-exit" : ""}
        style={{
          opacity: phase === "in" ? 0 : 1,
          transition: phase === "in" ? "opacity 0.6s ease" : undefined,
          textAlign: "center",
        }}
      >
        <h1
          className={`font-black tracking-tighter select-none ${phase === "pulse" ? "logo-pulse" : ""}`}
          style={{
            fontSize: "clamp(3rem, 10vw, 6rem)",
            background: "linear-gradient(135deg, #e50914 0%, #f5a623 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          CINNY
        </h1>
        <p
          style={{
            color: "#888",
            fontSize: "1rem",
            letterSpacing: "0.3em",
            marginTop: "0.5rem",
            opacity: phase === "pulse" ? 1 : 0,
            transition: "opacity 0.8s ease 0.3s",
          }}
        >
          INDIA'S STREAM
        </p>
      </div>
    </div>
  );
}
