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
        // Optional: show verification message if email confirmation is required
        // But for fast prototyping, we assume auto-confirm or redirect
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
    <div className="container justify-center items-center">
      <div className="flex flex-col items-center gap-4 animate-slide-up" style={{ width: "100%", maxWidth: "400px" }}>
        
        <div className="flex items-center justify-center btn-icon" style={{ backgroundColor: "var(--accent-primary)", color: "#fff", width: "3.5rem", height: "3.5rem" }}>
          <Wallet size={28} />
        </div>
        
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-h1">SpendTracker</h1>
          <p className="text-sm">Manage your money seamlessly.</p>
        </div>

        <form onSubmit={handleAuth} className="card flex flex-col gap-4" style={{ width: "100%" }}>
          <h2 className="text-h2" style={{ textAlign: "center", marginBottom: "1rem" }}>
            {isSignUp ? "Create an account" : "Welcome back"}
          </h2>
          
          {error && <div className="text-danger text-sm" style={{ textAlign: "center" }}>{error}</div>}
          
          <input
            type="email"
            placeholder="Email"
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
          
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: "0.5rem" }}>
            {loading ? "Please wait..." : (isSignUp ? "Sign Up" : "Sign In")}
          </button>
        </form>

        <button 
          className="btn" 
          style={{ background: "transparent", color: "var(--text-secondary)", fontSize: "0.875rem" }}
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
