"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { ArrowLeft, Trash2 } from "lucide-react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, SPECIAL_CATEGORIES } from "@/utils/categories";

export default function EditTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");

  useEffect(() => {
    const fetchTransaction = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setError("Transaction not found");
        setLoading(false);
        return;
      }

      setAmount(data.amount.toString());
      setCategory(data.category);
      setNotes(data.notes || "");
      setType(data.type || "expense");
      setLoading(false);
    };

    if (id) {
      fetchTransaction();
    }
  }, [id, router]);

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error: dbError } = await supabase
        .from("transactions")
        .update({
          amount: Number(amount),
          category,
          notes: notes || null,
        })
        .eq("id", id);

      if (dbError) throw dbError;
      
      router.back();
    } catch (err: any) {
      setError(err.message || "Failed to update transaction");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    
    setDeleting(true);
    try {
      const { error: dbError } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;
      
      router.back();
    } catch (err: any) {
      setError(err.message || "Failed to delete transaction");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container items-center justify-center">
        <div className="loading-pulse">
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  const isSpecial = SPECIAL_CATEGORIES.some(c => c.id === category);
  const categories = type === "income" ? INCOME_CATEGORIES : (isSpecial ? [...EXPENSE_CATEGORIES, ...SPECIAL_CATEGORIES] : EXPENSE_CATEGORIES);

  return (
    <div className="container animate-slide-up" style={{ paddingBottom: "6rem" }}>
      <header className="flex items-center justify-between" style={{ marginBottom: "2rem", paddingTop: "0.5rem" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="btn-icon">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-h2">Edit {type === "income" ? "Income" : "Expense"}</h1>
        </div>
        <button 
          onClick={handleDelete} 
          className="btn-icon"
          style={{ color: "var(--danger)" }}
          disabled={deleting}
        >
          <Trash2 size={22} />
        </button>
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
              step="0.01"
              min="0"
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: type === "income" ? "var(--success)" : "var(--text-primary)",
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
            {categories.map((cat) => {
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
          className={`btn w-full ${type === "income" ? "btn-success" : "btn-primary"}`}
          style={{ padding: "1rem", fontSize: "1rem" }}
          onClick={handleSave}
          disabled={saving || deleting}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
