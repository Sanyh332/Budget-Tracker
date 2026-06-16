"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { EXPENSE_CATEGORIES } from "@/utils/categories";
import { GlassCard, Button, Input } from "@glinui/ui";

export default function BudgetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Budgets map: { categoryId: amount }
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [expectedIncome, setExpectedIncome] = useState<number>(0);
  const [currentBalance, setCurrentBalance] = useState<number>(0);

  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const fetchBudgets = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const [budgetsRes, balanceRes] = await Promise.all([
        supabase.from("budgets").select("category,amount"),
        supabase.rpc("get_balance")
      ]);

      if (budgetsRes.data && !budgetsRes.error) {
        const budgetMap: Record<string, number> = {};
        let income = 0;
        
        budgetsRes.data.forEach((b) => {
          if (b.category === "expected_income") {
            income = Number(b.amount);
          } else {
            budgetMap[b.category] = Number(b.amount);
          }
        });

        setBudgets(budgetMap);
        setExpectedIncome(income);
      }

      if (balanceRes.data !== null && !balanceRes.error) {
        setCurrentBalance(Number(balanceRes.data));
      }

      setLoading(false);
    };

    fetchBudgets();
  }, [router]);

  const handleBudgetChange = (category: string, value: string) => {
    setBudgets((prev) => ({
      ...prev,
      [category]: Number(value) || 0,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: deleteError } = await supabase
        .from("budgets")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      const toInsert = [
        ...Object.entries(budgets)
          .filter(([_, amount]) => amount > 0)
          .map(([cat, amount]) => ({
            user_id: user.id,
            category: cat,
            amount: amount,
          })),
        ...(expectedIncome > 0 ? [{
          user_id: user.id,
          category: "expected_income",
          amount: expectedIncome,
        }] : []),
      ];

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("budgets")
          .insert(toInsert);

        if (insertError) throw insertError;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save budgets");
    } finally {
      setSaving(false);
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

  const totalBudgeted = Object.values(budgets).reduce((a, b) => a + b, 0);
  const plannedSavings = expectedIncome - totalBudgeted;

  const monthsDiff = (() => {
    if (!targetDate) return 0;
    const now = new Date();
    const [year, month] = targetDate.split('-').map(Number);
    const months = (year - now.getFullYear()) * 12 + (month - (now.getMonth() + 1));
    return Math.max(0, months);
  })();

  const projectedTotal = currentBalance + (plannedSavings * monthsDiff);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col p-4 pb-24 min-h-screen animate-slide-up">
      <header className="mb-6 pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Budget Planner</h1>
        <p className="text-sm text-muted mt-1">Set your monthly category limits.</p>
      </header>

      {/* Summary Card */}
      <GlassCard className="mb-6 p-5">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium">Expected Income</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">MVR</span>
            <Input 
              variant="glass"
              type="number" 
              value={expectedIncome || ""}
              onChange={(e) => setExpectedIncome(Number(e.target.value) || 0)}
              placeholder="0"
              className="w-[100px] text-right font-semibold text-success bg-background/50"
            />
          </div>
        </div>

        <div className="w-full h-px bg-border my-4" />

        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium">Total Budgeted</span>
          <span className="font-semibold text-[0.9375rem]">MVR {totalBudgeted.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-semibold text-[0.9375rem]">Planned Savings</span>
          <span className={`font-bold text-lg ${plannedSavings >= 0 ? "text-success" : "text-destructive"}`}>
            MVR {plannedSavings.toFixed(2)}
          </span>
        </div>
      </GlassCard>

      {error && (
        <div className="bg-destructive/10 p-3 rounded-xl mb-4">
          <p className="text-destructive text-sm font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-success/10 p-3 rounded-xl mb-4">
          <p className="text-success text-sm font-medium">Budgets saved successfully!</p>
        </div>
      )}

      <div className="animate-slide-up stagger-2">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Category Limits</h3>
        
        <GlassCard className="p-0 overflow-hidden">
          {EXPENSE_CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            const currentVal = budgets[cat.id] || "";
            
            return (
              <div key={cat.id} className={`flex justify-between items-center px-4 py-3 ${idx < EXPENSE_CATEGORIES.length - 1 ? 'border-b border-border' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-background/50 border border-border shadow-sm">
                    <Icon size={16} color={cat.color} />
                  </div>
                  <span className="font-medium text-sm">{cat.label}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">MVR</span>
                  <Input 
                    variant="glass"
                    type="number" 
                    placeholder="0"
                    value={currentVal}
                    onChange={(e) => handleBudgetChange(cat.id, e.target.value)}
                    className="w-[80px] text-right bg-background/50"
                  />
                </div>
              </div>
            );
          })}
        </GlassCard>
      </div>

      {/* Motivational Projection Card */}
      <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-accent to-accent/80 text-white shadow-[0_8px_32px_var(--color-accent)] animate-slide-up stagger-3 relative overflow-hidden">
        <div className="absolute top-[-50%] right-[-30%] w-[200px] h-[200px] bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-20%] w-[160px] h-[160px] bg-white/5 rounded-full blur-xl pointer-events-none" />
        
        <h3 className="font-bold mb-4 flex items-center gap-2 text-[0.9375rem] relative z-10">
          🚀 Savings Projection
        </h3>
        
        <div className="flex justify-between items-center mb-4 relative z-10">
          <span className="text-white/80 text-sm">Project until:</span>
          <input 
            type="month" 
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="bg-white/15 border border-white/20 rounded-lg text-white px-3 py-1.5 outline-none text-sm w-32"
          />
        </div>

        <div className="text-center py-3 relative z-10">
          <p className="text-white/80 text-sm mb-2">
            In <strong>{monthsDiff} month{monthsDiff !== 1 && 's'}</strong>, your balance will be:
          </p>
          <h2 className="text-4xl font-extrabold m-0 tracking-tight">
            MVR {projectedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <p className="text-xs text-white/70 mt-2">
            Current Balance + {monthsDiff} × MVR {plannedSavings.toFixed(0)}
          </p>
        </div>
      </div>

      <Button 
        variant="liquid" 
        className="w-full mt-6 py-6 text-base font-bold" 
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Budgets"}
      </Button>
    </div>
  );
}
