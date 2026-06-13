"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/utils/categories";

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
    return <div className="container items-center justify-center"><p className="text-secondary">Loading...</p></div>;
  }

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const themeColor = type === "income" ? "var(--success)" : "var(--text-primary)";

  return (
    <div className="container animate-slide-up">
      <header className="flex items-center justify-between" style={{ marginBottom: "2rem" }}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="btn-icon" style={{ border: "none" }}>
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-h2">Edit {type === "income" ? "Income" : "Expense"}</h1>
        </div>
        <button 
          onClick={handleDelete} 
          className="btn-icon text-danger" 
          style={{ border: "none" }}
          disabled={deleting}
        >
          <Trash2 size={24} />
        </button>
      </header>

      {error && <div className="text-danger text-sm mb-4">{error}</div>}

      <div className="flex flex-col gap-6" style={{ paddingBottom: "100px" }}>
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
              step="0.01"
              min="0"
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: themeColor,
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
            {categories.map((cat) => {
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
          className="btn btn-primary" 
          style={{ padding: "1rem", fontSize: "1.125rem", marginTop: "1rem", backgroundColor: type === "income" ? "var(--success)" : "var(--accent-primary)", border: "none" }}
          onClick={handleSave}
          disabled={saving || deleting}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
