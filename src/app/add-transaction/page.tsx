"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EXPENSE_CATEGORIES as CATEGORIES } from "@/utils/categories";
import { GlassCard, Button, Input } from "@glinui/ui";

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
    <div className="w-full max-w-md mx-auto flex flex-col p-4 pb-32 min-h-screen animate-slide-up">
      <header className="flex items-center gap-3 mb-6 pt-2">
        <Link href="/dashboard" className="w-10 h-10 rounded-full flex items-center justify-center bg-background/50 border border-border shadow-sm hover:bg-foreground/5 transition-colors">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Add Expense</h1>
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
              autoFocus
              step="0.01"
              min="0"
              className="bg-transparent border-none outline-none text-center p-0 m-0 w-[4ch] max-w-full"
              style={{ width: amount.length > 0 ? `${Math.max(amount.length + 1, 3)}ch` : "4ch" }}
            />
          </div>
        </GlassCard>

        {/* Category Selection */}
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Category</p>
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => {
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
          className="w-full mt-4 py-6 text-base font-bold shadow-[0_8px_32px_var(--color-accent)]" 
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Expense"}
        </Button>
      </div>
    </div>
  );
}
