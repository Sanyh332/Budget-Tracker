"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { INCOME_CATEGORIES as CATEGORIES } from "@/utils/categories";

export default function AddIncomePage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("salary");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
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
          category,
          notes: notes || null,
          type: "income",
        });

      if (dbError) throw dbError;
      
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to save income");
      setLoading(false);
    }
  };

  return (
    <div className="container animate-slide-up">
      <header className="flex items-center gap-4" style={{ marginBottom: "2rem" }}>
        <Link href="/dashboard" className="btn-icon">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-h2">Add Income</h1>
      </header>

      {error && <div className="text-danger text-sm mb-4">{error}</div>}

      <div className="flex flex-col gap-6">
        {/* Amount Input */}
        <div className="card" style={{ padding: "2rem 1rem", textAlign: "center" }}>
          <p className="text-sm" style={{ marginBottom: "0.5rem" }}>Amount</p>
          <div className="flex items-center justify-center gap-2 text-h1" style={{ fontSize: "3rem" }}>
            <span style={{ color: "var(--text-secondary)", fontSize: "1.5rem" }}>MVR</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              autoFocus
              step="0.01"
              min="0"
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--success)",
                fontSize: "inherit",
                fontWeight: "inherit",
                width: amount.length > 0 ? `${amount.length + 1}ch` : "4ch",
                maxWidth: "100%",
                textAlign: "center"
              }}
            />
          </div>
        </div>

        {/* Category Selection */}
        <div>
          <p className="text-sm" style={{ marginBottom: "1rem", fontWeight: 500 }}>Category</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "1rem 0.5rem",
                    borderRadius: "var(--radius-lg)",
                    border: `1px solid ${isSelected ? cat.color : "var(--border)"}`,
                    background: isSelected ? `${cat.color}15` : "var(--bg-secondary)",
                    color: isSelected ? cat.color : "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Icon size={24} />
                  <span style={{ fontSize: "0.75rem", fontWeight: isSelected ? 600 : 400, textAlign: "center" }}>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="text-sm" style={{ marginBottom: "0.5rem", fontWeight: 500 }}>Notes (Optional)</p>
          <input
            type="text"
            className="input-field"
            placeholder="What was this for?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Submit */}
        <button 
          className="btn" 
          style={{ padding: "1rem", fontSize: "1.125rem", marginTop: "1rem", backgroundColor: "var(--success)", color: "white", border: "none" }}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Income"}
        </button>
      </div>
    </div>
  );
}
