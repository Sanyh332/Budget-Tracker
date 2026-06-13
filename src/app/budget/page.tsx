"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { EXPENSE_CATEGORIES } from "@/utils/categories";

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

      const [budgetsRes, txRes] = await Promise.all([
        supabase.from("budgets").select("*"),
        supabase.from("transactions").select("*")
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

      if (txRes.data && !txRes.error) {
        const balance = txRes.data.reduce((acc, curr) => {
          return (curr.type || "expense") === "income" ? acc + Number(curr.amount) : acc - Number(curr.amount);
        }, 0);
        setCurrentBalance(balance);
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

      // We need to upsert all budgets. Supabase allows bulk upsert if we have conflict resolution.
      // Easiest is to delete all existing budgets for this user and insert new ones, 
      // or just upsert with a composite key. Since we might not have a composite key setup yet,
      // let's do a safe delete then insert approach.
      
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
    return <div className="container items-center justify-center"><p className="text-secondary">Loading...</p></div>;
  }

  const totalBudgeted = Object.values(budgets).reduce((a, b) => a + b, 0);
  const plannedSavings = expectedIncome - totalBudgeted;

  const monthsDiff = () => {
    if (!targetDate) return 0;
    const now = new Date();
    const [year, month] = targetDate.split('-').map(Number);
    const months = (year - now.getFullYear()) * 12 + (month - (now.getMonth() + 1));
    return Math.max(0, months);
  }();

  const projectedTotal = currentBalance + (plannedSavings * monthsDiff);

  return (
    <div className="container animate-slide-up" style={{ paddingBottom: "100px" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 className="text-h2">Budget Planner</h1>
        <p className="text-sm">Set your monthly category limits.</p>
      </header>

      {/* Summary Card */}
      <div className="card" style={{ marginBottom: "2rem", background: "linear-gradient(135deg, var(--bg-elevated), var(--bg-secondary))" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
          <span className="text-secondary">Expected Income</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span className="text-sm">MVR</span>
            <input 
              type="number" 
              value={expectedIncome || ""}
              onChange={(e) => setExpectedIncome(Number(e.target.value) || 0)}
              placeholder="0"
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--success)",
                padding: "0.25rem 0.5rem",
                width: "100px",
                textAlign: "right",
                fontWeight: 600
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
          <span className="text-secondary">Total Budgeted</span>
          <span style={{ fontWeight: 600 }}>MVR {totalBudgeted.toFixed(2)}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600 }}>Planned Savings</span>
          <span style={{ fontWeight: 700, color: plannedSavings >= 0 ? "var(--success)" : "var(--danger)" }}>
            MVR {plannedSavings.toFixed(2)}
          </span>
        </div>
      </div>

      {error && <div className="text-danger text-sm mb-4">{error}</div>}
      {success && <div className="text-success text-sm mb-4">Budgets saved successfully!</div>}

      <div className="flex flex-col gap-3">
        <h3 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Category Limits</h3>
        
        {EXPENSE_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const currentVal = budgets[cat.id] || "";
          
          return (
            <div key={cat.id} className="card flex justify-between items-center" style={{ padding: "1rem" }}>
              <div className="flex items-center gap-3">
                <div style={{ padding: "0.5rem", borderRadius: "var(--radius-full)", background: `${cat.color}15`, color: cat.color }}>
                  <Icon size={20} />
                </div>
                <span style={{ fontWeight: 500 }}>{cat.label}</span>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="text-sm text-secondary">MVR</span>
                <input 
                  type="number" 
                  placeholder="0"
                  value={currentVal}
                  onChange={(e) => handleBudgetChange(cat.id, e.target.value)}
                  style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    padding: "0.5rem",
                    width: "80px",
                    textAlign: "right"
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Motivational Projection Card */}
      <div className="card" style={{ marginTop: "2rem", background: "linear-gradient(135deg, var(--accent-primary), #8b5cf6)", color: "white", border: "none" }}>
        <h3 style={{ fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          🚀 Savings Projection
        </h3>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <span style={{ opacity: 0.9 }}>Project until:</span>
          <input 
            type="month" 
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "var(--radius-md)",
              color: "white",
              padding: "0.5rem",
              outline: "none"
            }}
          />
        </div>

        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <p style={{ opacity: 0.9, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
            If you stick to this budget, in <strong>{monthsDiff} month{monthsDiff !== 1 && 's'}</strong> your total balance will be:
          </p>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 700, margin: "0" }}>
            MVR {projectedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <p style={{ fontSize: "0.75rem", opacity: 0.8, marginTop: "0.5rem" }}>
            (Current Balance + {monthsDiff} × MVR {plannedSavings.toFixed(0)})
          </p>
        </div>
      </div>

      <button 
        className="btn btn-primary" 
        style={{ width: "100%", marginTop: "2rem", padding: "1rem", fontSize: "1.125rem", border: "none" }}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Budgets"}
      </button>
    </div>
  );
}
