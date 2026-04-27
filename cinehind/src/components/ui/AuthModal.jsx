import { useState } from "react";
import { useApp } from "../../context/AppContext";

export default function AuthModal({ onClose }) {
  const { login, register, showToast, accentColor } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return showToast("Please fill all fields");
    setLoading(true);
    
    try {
      const url = isLogin ? "http://localhost:5000/api/auth/login" : "http://localhost:5000/api/auth/signup";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Authentication failed");
      
      if (isLogin) {
        login(data.token, data.user);
        showToast("Logged in successfully");
      } else {
        register(data.token, data.user);
        showToast("Account created successfully");
      }
      onClose();
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6 relative" style={{ background: "#111", border: "1px solid #333" }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
        <h2 className="text-2xl font-black text-white mb-6 text-center">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[#222] text-white px-4 py-3 rounded-xl border border-[#333] focus:outline-none focus:border-white transition-all"
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#222] text-white px-4 py-3 rounded-xl border border-[#333] focus:outline-none focus:border-white transition-all"
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white transition-all mt-2 disabled:opacity-50"
            style={{ background: accentColor || "#e50914" }}
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-400 mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-white font-bold hover:underline">
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
