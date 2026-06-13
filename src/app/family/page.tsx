"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Users, Copy, Check, ArrowRight } from "lucide-react";

export default function FamilyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchFamily();
  }, []);

  const fetchFamily = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select(`families(name, invite_code)`)
      .eq("user_id", user.id)
      .single();

    if (data && data.families && !error) {
      const fam = Array.isArray(data.families) ? data.families[0] : data.families;
      if (fam) {
        setFamilyName(fam.name);
        setInviteCode(fam.invite_code);
      }
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoining(true);
    setJoinError("");

    const { data, error } = await supabase.rpc("join_family", { invite_code: joinCode.trim() });
    
    if (error) {
      setJoinError("Failed to join. Please ensure the code is correct.");
    } else if (data === true) {
      // Successfully joined, fetch new family data
      await fetchFamily();
      setJoinCode("");
      alert("Successfully joined family! All data is now pooled.");
    } else {
      setJoinError("Invalid invite code.");
    }
    
    setJoining(false);
  };

  if (loading) {
    return <div className="container items-center justify-center"><p className="text-secondary">Loading...</p></div>;
  }

  return (
    <div className="container animate-slide-up" style={{ paddingBottom: "100px" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 className="text-h2 flex items-center gap-2">
          <Users size={28} /> Family Pooling
        </h1>
        <p className="text-sm">Link your accounts to combine balances and budgets.</p>
      </header>

      {/* Current Family Card */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-secondary)" }}>Your Current Database</h3>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
          {familyName || "My Family"}
        </h2>

        <div style={{ background: "var(--bg-primary)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
          <p className="text-sm" style={{ marginBottom: "0.5rem" }}>Your Invite Code</p>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "2px", color: "var(--accent-primary)" }}>
              {inviteCode || "------"}
            </span>
            <button 
              onClick={handleCopy}
              className="btn-icon" 
              style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)" }}
            >
              {copied ? <Check size={20} className="text-success" /> : <Copy size={20} />}
            </button>
          </div>
          <p className="text-sm" style={{ marginTop: "0.5rem", opacity: 0.8 }}>
            Share this code with your partner to merge their account into this database.
          </p>
        </div>
      </div>

      {/* Join Family Form */}
      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: "1rem" }}>Join an Existing Family</h3>
        <p className="text-sm" style={{ marginBottom: "1.5rem" }}>
          Have an invite code from your partner? Enter it below to move your account into their database. All your historical transactions will be pooled.
        </p>

        <form onSubmit={handleJoin} className="flex flex-col gap-3">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter Invite Code"
            className="input-field"
            required
            style={{ textTransform: "uppercase", letterSpacing: "1px" }}
          />
          
          {joinError && <p className="text-danger text-sm">{joinError}</p>}

          <button 
            type="submit" 
            className="btn btn-primary flex items-center justify-center gap-2" 
            disabled={joining || !joinCode.trim()}
          >
            {joining ? "Joining..." : "Join Family"} <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
