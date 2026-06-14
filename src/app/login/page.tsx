"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Wallet } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container justify-center items-center" style={{ 
      background: "linear-gradient(160deg, var(--bg-primary) 0%, var(--bg-primary) 50%, rgba(99, 102, 241, 0.05) 100%)",
      position: "relative"
    }}>
      {/* Decorative orbs */}
      <div style={{
        position: "absolute", top: "10%", right: "-10%", width: "300px", height: "300px",
        background: "radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute", bottom: "15%", left: "-15%", width: "250px", height: "250px",
        background: "radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none"
      }} />

      <div className="flex flex-col items-center gap-4 animate-scale-in" style={{ width: "100%", maxWidth: "380px", position: "relative", zIndex: 1 }}>
        
        {/* Logo */}
        <div style={{ 
          background: "var(--gradient-hero)",
          width: "4rem", height: "4rem",
          borderRadius: "var(--radius-lg)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "var(--shadow-glow)",
          marginBottom: "0.5rem"
        }}>
          <Wallet size={28} color="white" />
        </div>
        
        <div className="flex flex-col items-center" style={{ marginBottom: "2rem" }}>
          <h1 className="text-h1" style={{ marginBottom: "0.5rem" }}>SpendTracker</h1>
          <p className="text-sm">Manage your money seamlessly.</p>
        </div>

        <form onSubmit={handleAuth} className="card-static flex flex-col gap-4" style={{ width: "100%", padding: "2rem 1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, textAlign: "center", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
            {isSignUp ? "Create an account" : "Welcome back"}
          </h2>
          
          {error && <div className="text-danger text-sm" style={{ textAlign: "center", background: "var(--danger-glow)", padding: "0.5rem", borderRadius: "var(--radius-md)" }}>{error}</div>}
          
          <input
            type="email"
            placeholder="Email address"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ padding: "0.875rem", marginTop: "0.5rem" }}>
            {loading ? "Please wait..." : (isSignUp ? "Sign Up" : "Sign In")}
          </button>
        </form>

        <button 
          className="btn" 
          style={{ background: "transparent", color: "var(--text-secondary)", fontSize: "0.8125rem" }}
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
