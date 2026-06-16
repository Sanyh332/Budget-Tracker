"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { ArrowLeft, Trash2 } from "lucide-react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/utils/categories";
import { GlassCard, Button, Input } from "@glinui/ui";

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
      <div className="flex w-full max-w-md mx-auto p-4 min-h-screen items-center justify-center">
        <div className="animate-pulse">
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col p-4 pb-32 min-h-screen animate-slide-up">
      <header className="flex items-center justify-between mb-6 pt-2">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-full flex items-center justify-center bg-background/50 border border-border shadow-sm hover:bg-foreground/5 transition-colors">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Edit {type === "income" ? "Income" : "Expense"}</h1>
        </div>
        <button 
          onClick={handleDelete} 
          className="w-10 h-10 rounded-full flex items-center justify-center bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors"
          disabled={deleting}
        >
          <Trash2 size={22} />
        </button>
      </header>

      {error && (
        <div className="bg-destructive/10 p-3 rounded-xl mb-4">
          <p className="text-destructive text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Amount Input */}
        <GlassCard className="text-center py-10 px-4 flex flex-col items-center">
          <p className="text-sm text-muted font-medium mb-3">Amount</p>
          <div className="flex items-center justify-center gap-2 text-5xl font-extrabold tracking-tight">
            <span className="text-muted text-xl font-medium">MVR</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={`bg-transparent border-none outline-none text-center p-0 m-0 w-[4ch] max-w-full ${type === "income" ? "text-success" : "text-foreground"}`}
              style={{ width: amount.length > 0 ? `${Math.max(amount.length + 1, 3)}ch` : "4ch" }}
            />
          </div>
        </GlassCard>

        {/* Category Selection */}
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Category</p>
          <div className="grid grid-cols-3 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all duration-200 border ${
                    isSelected 
                      ? "border-transparent shadow-md scale-105" 
                      : "border-border bg-background/40 hover:bg-background/80"
                  }`}
                  style={{
                    backgroundColor: isSelected ? `${cat.color}15` : undefined,
                    borderColor: isSelected ? cat.color : undefined,
                    color: isSelected ? cat.color : "var(--color-foreground)",
                  }}
                >
                  <Icon size={24} color={isSelected ? cat.color : "currentColor"} />
                  <span className={`text-xs ${isSelected ? "font-bold" : "font-medium"}`}>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Notes (optional)</p>
          <Input
            variant="glass"
            type="text"
            placeholder="What was this for?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-background/50"
          />
        </div>

        {/* Submit */}
        <Button 
          variant="liquid" 
          className={`w-full mt-4 py-6 text-base font-bold ${type === "income" ? "!bg-success shadow-[0_8px_32px_var(--success-glow)] text-white" : "shadow-[0_8px_32px_var(--accent-glow)]"}`}
          onClick={handleSave}
          disabled={saving || deleting}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
