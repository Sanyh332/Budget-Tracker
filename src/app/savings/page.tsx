"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { PiggyBank, ArrowDownToLine, TrendingUp, Vault } from "lucide-react";
import Link from "next/link";

export default function SavingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [sweptSavings, setSweptSavings] = useState(0);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [withdrawalsList, setWithdrawalsList] = useState<any[]>([]);
  const [historyList, setHistoryList] = useState<{ month: string, plannedSavings: number }[]>([]);
  const [monthlyPlanned, setMonthlyPlanned] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const [sweptRes, withdrawalRes, budgetsRes, historyRes] = await Promise.all([
        supabase.rpc("get_swept_savings"),
        supabase.from("transactions").select("*").eq("category", "savings_withdrawal").order("created_at", { ascending: false }),
        supabase.from("budgets").select("category,amount"),
        supabase.from("budget_history").select("month, category, budget_amount").order("month", { ascending: false })
      ]);

      if (sweptRes.data !== null && !sweptRes.error) {
        setSweptSavings(Number(sweptRes.data));
      }

      if (withdrawalRes.data && !withdrawalRes.error) {
        const sum = withdrawalRes.data.reduce((acc, curr) => acc + Number(curr.amount), 0);
        setTotalWithdrawals(sum);
        setWithdrawalsList(withdrawalRes.data);
      }

      if (budgetsRes.data && !budgetsRes.error) {
        let expectedIncome = 0;
        let totalBudgeted = 0;
        budgetsRes.data.forEach((b: any) => {
          if (b.category === "expected_income") expectedIncome = Number(b.amount);
          else totalBudgeted += Number(b.amount);
        });
        setMonthlyPlanned(Math.max(0, expectedIncome - totalBudgeted));
      }

      if (historyRes.data && !historyRes.error) {
        const historyByMonth: Record<string, { income: number, budgetSum: number }> = {};
        historyRes.data.forEach((row: any) => {
          if (!historyByMonth[row.month]) historyByMonth[row.month] = { income: 0, budgetSum: 0 };
          
          if (row.category === "expected_income") {
            historyByMonth[row.month].income = Number(row.budget_amount);
          } else {
            historyByMonth[row.month].budgetSum += Number(row.budget_amount);
          }
        });

        const formattedHistory = Object.keys(historyByMonth).sort((a, b) => b.localeCompare(a)).map(month => {
          const { income, budgetSum } = historyByMonth[month];
          return {
            month,
            plannedSavings: Math.max(0, income - budgetSum)
          };
        });
        setHistoryList(formattedHistory);
      }

      setLoading(false);
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="container items-center justify-center">
        <div className="loading-pulse">
          <p className="text-secondary">Loading Savings...</p>
        </div>
      </div>
    );
  }

  const totalSavings = Math.max(0, sweptSavings - totalWithdrawals);

  return (
    <div className="container animate-slide-up" style={{ paddingBottom: "6rem" }}>
      <header style={{ marginBottom: "1.5rem", paddingTop: "0.5rem" }}>
        <h1 className="text-h2">Savings Tracker</h1>
        <p className="text-sm" style={{ marginTop: "0.25rem" }}>Monitor your wealth accumulation.</p>
      </header>

      {/* Hero Card */}
      <div className="hero-card animate-slide-up stagger-1" style={{ marginBottom: "1.5rem" }}>
        <div className="flex items-center gap-2" style={{ marginBottom: "0.5rem" }}>
          <Vault size={16} color="white" />
          <p style={{ fontSize: "0.875rem", color: "white", margin: 0 }}>Total Available Savings</p>
        </div>
        <h2 style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0.25rem 0 1.5rem", letterSpacing: "-0.03em", color: "white" }}>
          MVR {totalSavings.toFixed(2)}
        </h2>

        <Link 
          href="/withdraw-savings" 
          style={{ 
            width: "100%", 
            backgroundColor: "white", 
            color: "var(--accent-primary)", 
            display: "flex", 
            justifyContent: "center",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.875rem",
            borderRadius: "var(--radius-md)",
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}
        >
          <ArrowDownToLine size={18} />
          Withdraw from Savings
        </Link>
      </div>

      <div className="animate-slide-up stagger-2">
        <h3 className="section-header" style={{ marginBottom: "0.75rem" }}>Savings Breakdown</h3>
        
        <div className="flex flex-col gap-3">
          {/* Swept Savings */}
          <div className="card-static flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div style={{ padding: "0.5rem", borderRadius: "var(--radius-md)", background: "var(--accent-primary)22", color: "var(--accent-primary)" }}>
                <PiggyBank size={20} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Swept Savings</p>
                <p className="text-xs text-secondary" style={{ marginTop: "0.125rem" }}>Unspent budget from past months</p>
              </div>
            </div>
            <p style={{ fontWeight: 700 }}>MVR {sweptSavings.toFixed(2)}</p>
          </div>

          {/* Withdrawals */}
          <div className="card-static flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div style={{ padding: "0.5rem", borderRadius: "var(--radius-md)", background: "var(--danger-glow)", color: "var(--danger)" }}>
                <ArrowDownToLine size={20} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Total Withdrawn</p>
                <p className="text-xs text-secondary" style={{ marginTop: "0.125rem" }}>Money taken out of savings</p>
              </div>
            </div>
            <p style={{ fontWeight: 700, color: "var(--danger)" }}>-MVR {totalWithdrawals.toFixed(2)}</p>
          </div>

          {/* Monthly Planned */}
          <div className="card-static flex items-center justify-between" style={{ marginTop: "0.5rem" }}>
            <div className="flex items-center gap-3">
              <div style={{ padding: "0.5rem", borderRadius: "var(--radius-md)", background: "var(--success-glow)", color: "var(--success)" }}>
                <TrendingUp size={20} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>Monthly Planned Rate</p>
                <p className="text-xs text-secondary" style={{ marginTop: "0.125rem" }}>Based on your current budgets</p>
              </div>
            </div>
            <p style={{ fontWeight: 700, color: "var(--success)" }}>+MVR {monthlyPlanned.toFixed(2)} / mo</p>
          </div>
        </div>
      </div>

      {/* Withdrawal History */}
      {withdrawalsList.length > 0 && (
        <div className="animate-slide-up stagger-3" style={{ marginTop: "2rem" }}>
          <h3 className="section-header" style={{ marginBottom: "0.75rem" }}>Withdrawal History</h3>
          <div className="flex flex-col gap-2">
            {withdrawalsList.map((w: any) => (
              <Link key={w.id} href={`/edit-transaction/${w.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card-static flex items-center justify-between" style={{ padding: "0.875rem", cursor: "pointer" }}>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: "0.875rem" }}>{w.notes || "Savings Withdrawal"}</p>
                    <p className="text-xs text-secondary" style={{ marginTop: "0.125rem" }}>
                      {new Date(w.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--danger)" }}>
                    -MVR {Number(w.amount).toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Planned Savings History */}
      {historyList.length > 0 && (
        <div className="animate-slide-up stagger-4" style={{ marginTop: "2rem" }}>
          <h3 className="section-header" style={{ marginBottom: "0.75rem" }}>Historical Planned Savings</h3>
          <div className="flex flex-col gap-2">
            {historyList.map((h) => {
              const [year, monthStr] = h.month.split('-');
              const date = new Date(Number(year), Number(monthStr) - 1);
              const formattedMonth = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
              
              return (
                <div key={h.month} className="card-static flex items-center justify-between" style={{ padding: "0.875rem" }}>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: "0.875rem" }}>{formattedMonth}</p>
                    <p className="text-xs text-secondary" style={{ marginTop: "0.125rem" }}>End of month goal</p>
                  </div>
                  <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--success)" }}>
                    MVR {h.plannedSavings.toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
