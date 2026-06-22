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

  // Budgets map: { categoryId: { amount, rollover_type } }
  const [budgets, setBudgets] = useState<Record<string, { amount: number, rollover_type: 'sweep' | 'rollover' }>>({});
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
        supabase.from("budgets").select("category,amount,rollover_type"),
        supabase.rpc("get_balance")
      ]);

      if (budgetsRes.data && !budgetsRes.error) {
        const budgetMap: Record<string, { amount: number, rollover_type: 'sweep' | 'rollover' }> = {};
        let income = 0;
        
        budgetsRes.data.forEach((b) => {
          if (b.category === "expected_income") {
            income = Number(b.amount);
          } else {
            budgetMap[b.category] = { 
              amount: Number(b.amount), 
              rollover_type: b.rollover_type || 'sweep' 
            };
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
      [category]: {
        amount: Number(value) || 0,
        rollover_type: prev[category]?.rollover_type || 'sweep'
      },
    }));
  };

  const handleRolloverChange = (category: string, type: 'sweep' | 'rollover') => {
    setBudgets((prev) => ({
      ...prev,
      [category]: {
        amount: prev[category]?.amount || 0,
        rollover_type: type
      },
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
          .filter(([_, data]) => data.amount > 0)
          .map(([cat, data]) => ({
            user_id: user.id,
            category: cat,
            amount: data.amount,
            rollover_type: data.rollover_type
          })),
        ...(expectedIncome > 0 ? [{
          user_id: user.id,
          category: "expected_income",
          amount: expectedIncome,
          rollover_type: "sweep"
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
      <div className="container items-center justify-center">
        <div className="loading-pulse">
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  const totalBudgeted = Object.values(budgets).reduce((a, b) => a + b.amount, 0);
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
    <div className="container animate-slide-up" style={{ paddingBottom: "6rem" }}>
      <header style={{ marginBottom: "1.5rem", paddingTop: "0.5rem" }}>
        <h1 className="text-h2">Budget Planner</h1>
        <p className="text-sm" style={{ marginTop: "0.25rem" }}>Set your monthly category limits.</p>
      </header>

      {/* Summary Card */}
      <div className="card-static animate-slide-up stagger-1" style={{ marginBottom: "1.5rem" }}>
        <div className="flex justify-between items-center" style={{ marginBottom: "1rem" }}>
          <span className="text-sm" style={{ fontWeight: 500 }}>Expected Income</span>
          <div className="flex items-center gap-2">
            <span className="text-xs">MVR</span>
            <input 
              type="number" 
              value={expectedIncome || ""}
              onChange={(e) => setExpectedIncome(Number(e.target.value) || 0)}
              placeholder="0"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--success)",
                padding: "0.375rem 0.5rem",
                width: "100px",
                textAlign: "right",
                fontWeight: 600,
                fontFamily: "inherit",
                fontSize: "0.875rem"
              }}
            />
          </div>
        </div>

        <div className="divider" style={{ margin: "0.75rem 0" }} />

        <div className="flex justify-between items-center" style={{ marginBottom: "0.75rem" }}>
          <span className="text-sm" style={{ fontWeight: 500 }}>Total Budgeted</span>
          <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>MVR {totalBudgeted.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Planned Savings</span>
          <span style={{ fontWeight: 700, fontSize: "1.0625rem", color: plannedSavings >= 0 ? "var(--success)" : "var(--danger)" }}>
            MVR {plannedSavings.toFixed(2)}
          </span>
        </div>
      </div>

      {error && (
        <div style={{ background: "var(--danger-glow)", padding: "0.75rem", borderRadius: "var(--radius-md)", marginBottom: "1rem" }}>
          <p className="text-danger" style={{ fontSize: "0.8125rem" }}>{error}</p>
        </div>
      )}
      {success && (
        <div style={{ background: "var(--success-glow)", padding: "0.75rem", borderRadius: "var(--radius-md)", marginBottom: "1rem" }}>
          <p className="text-success" style={{ fontSize: "0.8125rem" }}>Budgets saved successfully!</p>
        </div>
      )}

      <div className="animate-slide-up stagger-2">
        <h3 className="section-header" style={{ marginBottom: "0.75rem" }}>Category Limits</h3>
        
        <div className="card-static" style={{ padding: 0, overflow: "hidden" }}>
          {EXPENSE_CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            const currentVal = budgets[cat.id]?.amount || "";
            const currentRollover = budgets[cat.id]?.rollover_type || 'sweep';
            
            return (
              <div key={cat.id} className="flex justify-between items-center" style={{ 
                padding: "0.875rem 1rem",
                borderBottom: idx < EXPENSE_CATEGORIES.length - 1 ? "1px solid var(--border)" : "none"
              }}>
                <div className="flex items-center gap-3">
                  <div style={{ padding: "0.375rem", borderRadius: "var(--radius-sm)", background: `${cat.color}12`, color: cat.color }}>
                    <Icon size={16} />
                  </div>
                  <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>{cat.label}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <select 
                    value={currentRollover}
                    onChange={(e) => handleRolloverChange(cat.id, e.target.value as 'sweep' | 'rollover')}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-secondary)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      marginRight: "0.25rem",
                      outline: "none"
                    }}
                  >
                    <option value="sweep">🧹 Sweep</option>
                    <option value="rollover">♻️ Roll</option>
                  </select>
                  <span className="text-xs">MVR</span>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={currentVal}
                    onChange={(e) => handleBudgetChange(cat.id, e.target.value)}
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-primary)",
                      padding: "0.375rem 0.5rem",
                      width: "80px",
                      textAlign: "right",
                      fontFamily: "inherit",
                      fontSize: "0.875rem"
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivational Projection Card */}
      <div className="hero-card animate-slide-up stagger-3" style={{ marginTop: "1.5rem" }}>
        <h3 style={{ fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", position: "relative", zIndex: 1, fontSize: "0.9375rem" }}>
          🚀 Savings Projection
        </h3>
        
        <div className="flex justify-between items-center" style={{ marginBottom: "1rem", position: "relative", zIndex: 1 }}>
          <span style={{ opacity: 0.85, fontSize: "0.8125rem" }}>Project until:</span>
          <input 
            type="month" 
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "var(--radius-md)",
              color: "white",
              padding: "0.375rem 0.5rem",
              outline: "none",
              fontFamily: "inherit",
              fontSize: "0.8125rem"
            }}
          />
        </div>

        <div className="text-center" style={{ padding: "0.75rem 0", position: "relative", zIndex: 1 }}>
          <p style={{ opacity: 0.85, fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
            In <strong>{monthsDiff} month{monthsDiff !== 1 && 's'}</strong>, your balance will be:
          </p>
          <h2 style={{ fontSize: "2.25rem", fontWeight: 800, margin: "0", letterSpacing: "-0.03em" }}>
            MVR {projectedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <p style={{ fontSize: "0.6875rem", opacity: 0.7, marginTop: "0.5rem" }}>
            Current Balance + {monthsDiff} × MVR {plannedSavings.toFixed(0)}
          </p>
        </div>
      </div>

      <button 
        className="btn btn-primary w-full" 
        style={{ marginTop: "1.5rem", padding: "1rem", fontSize: "1rem" }}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Budgets"}
      </button>
    </div>
  );
}
