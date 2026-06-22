"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { ArrowLeft, PiggyBank } from "lucide-react";
import Link from "next/link";

export default function WithdrawSavingsPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWithdraw = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: dbError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          amount: Number(amount),
          category: "savings_withdrawal",
          notes: notes || "Savings Withdrawal",
          type: "expense",
        });

      if (dbError) throw dbError;
      
      router.push("/savings");
    } catch (err: any) {
      setError(err.message || "Failed to withdraw from savings");
      setLoading(false);
    }
  };

  return (
    <div className="container animate-slide-up">
      <header className="flex items-center gap-3" style={{ marginBottom: "2rem", paddingTop: "0.5rem" }}>
        <Link href="/savings" className="btn-icon">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-h3">Withdraw Savings</h1>
      </header>

      {error && (
        <div style={{ background: "var(--danger-glow)", padding: "0.875rem", borderRadius: "var(--radius-md)", marginBottom: "1.5rem" }}>
          <p className="text-danger" style={{ fontSize: "0.875rem", fontWeight: 500 }}>{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Amount Input */}
        <div className="card-static flex flex-col items-center justify-center" style={{ padding: "2.5rem 1rem" }}>
          <div style={{ padding: "1rem", borderRadius: "50%", background: "var(--danger-glow)", color: "var(--danger)", marginBottom: "1rem" }}>
            <PiggyBank size={32} />
          </div>
          <p className="text-sm text-secondary" style={{ marginBottom: "0.5rem" }}>Amount to Withdraw</p>
          <div className="flex items-center justify-center gap-2">
            <span style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--text-secondary)" }}>MVR</span>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              style={{
                background: "transparent",
                border: "none",
                fontSize: "3rem",
                fontWeight: 800,
                width: "100%",
                maxWidth: "200px",
                textAlign: "center",
                color: "var(--text-primary)",
                outline: "none",
                padding: 0
              }}
              autoFocus
            />
          </div>
        </div>

        {/* Notes Input */}
        <div className="card-static" style={{ padding: "1rem" }}>
          <label className="text-sm" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
            What is it for? (Optional)
          </label>
          <input 
            type="text" 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Bought a new TV"
            style={{
              width: "100%",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "0.75rem",
              fontSize: "0.9375rem",
              color: "var(--text-primary)",
              outline: "none"
            }}
          />
        </div>

        <button 
          className="btn-primary" 
          onClick={handleWithdraw} 
          disabled={loading}
          style={{ 
            marginTop: "1.5rem", 
            padding: "1rem", 
            fontSize: "1rem", 
            fontWeight: 700,
            borderRadius: "var(--radius-md)",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)"
          }}
        >
          {loading ? "Processing..." : "Confirm Withdrawal"}
        </button>
      </div>
    </div>
  );
}
