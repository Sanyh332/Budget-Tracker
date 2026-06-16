"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Wallet } from "lucide-react";
import { GlassCard, Button, Input } from "@glinui/ui";

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
    <div className="w-full flex min-h-screen items-center justify-center p-4 relative bg-gradient-to-br from-background via-background to-accent/10 overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute top-10 -right-10 w-[300px] h-[300px] rounded-full bg-accent/20 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[250px] h-[250px] rounded-full bg-accent/20 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[380px] flex flex-col items-center gap-4 relative z-10 animate-slide-up">
        
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-[0_8px_32px_var(--color-accent)] mb-2">
          <Wallet size={28} color="white" />
        </div>
        
        <div className="flex flex-col items-center text-center mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">SpendTracker</h1>
          <p className="text-sm text-muted">Manage your money seamlessly.</p>
        </div>

        <GlassCard className="w-full flex flex-col gap-4 p-8">
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-center tracking-tight mb-2">
              {isSignUp ? "Create an account" : "Welcome back"}
            </h2>
            
            {error && <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-xl">{error}</div>}
            
            <Input
              variant="glass"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="py-6"
            />
            
            <Input
              variant="glass"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="py-6"
            />
            
            <Button variant="liquid" type="submit" disabled={loading} className="w-full py-6 mt-2 text-base font-bold">
              {loading ? "Please wait..." : (isSignUp ? "Sign Up" : "Sign In")}
            </Button>
          </form>
        </GlassCard>

        <Button 
          variant="ghost" 
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-muted text-sm mt-2"
        >
          {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
        </Button>
      </div>
    </div>
  );
}
