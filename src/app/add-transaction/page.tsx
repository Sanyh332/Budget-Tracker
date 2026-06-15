"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EXPENSE_CATEGORIES as CATEGORIES } from "@/utils/categories";

export default function AddTransactionPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("groceries");
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
          type: "expense",
        });

      if (dbError) throw dbError;
      
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to save transaction");
      setLoading(false);
    }
  };

  return (
    <div className="container animate-slide-up" style={{ paddingBottom: "6rem" }}>
      <header className="flex items-center gap-3" style={{ marginBottom: "2rem", paddingTop: "0.5rem" }}>
        <Link href="/dashboard" className="btn-icon">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-h2">Add Expense</h1>
      </header>

      {error && (
        <div style={{ background: "var(--danger-glow)", padding: "0.75rem", borderRadius: "var(--radius-md)", marginBottom: "1rem" }}>
          <p className="text-danger" style={{ fontSize: "0.8125rem" }}>{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Amount Input */}
        <div className="card-static text-center" style={{ padding: "2.5rem 1rem" }}>
          <p className="text-sm" style={{ marginBottom: "0.75rem" }}>Amount</p>
          <div className="flex items-center justify-center gap-2" style={{ fontSize: "2.75rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
            <span style={{ color: "var(--text-tertiary)", fontSize: "1.25rem", fontWeight: 500 }}>MVR</span>
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
                color: "inherit",
                fontSize: "inherit",
                fontWeight: "inherit",
                fontFamily: "inherit",
                width: amount.length > 0 ? `${Math.max(amount.length + 1, 3)}ch` : "4ch",
                maxWidth: "100%",
                textAlign: "center"
              }}
            />
          </div>
        </div>

        {/* Category Selection */}
        <div>
          <p className="section-header" style={{ marginBottom: "0.75rem" }}>Category</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.625rem" }}>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`category-chip ${isSelected ? "active" : ""}`}
                  style={{
                    borderColor: isSelected ? cat.color : undefined,
                    background: isSelected ? `${cat.color}12` : undefined,
                    color: isSelected ? cat.color : undefined,
                  }}
                >
                  <Icon size={22} />
                  <span style={{ fontWeight: isSelected ? 600 : undefined }}>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="section-header" style={{ marginBottom: "0.5rem" }}>Notes (optional)</p>
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
          className="btn btn-primary w-full" 
          style={{ padding: "1rem", fontSize: "1rem" }}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Expense"}
        </button>
      </div>
    </div>
  );
}
