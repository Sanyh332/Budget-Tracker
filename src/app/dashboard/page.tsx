"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Plus, LogOut, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";
import { getCategoryDetails } from "@/utils/categories";
import { Transaction } from "@/utils/types";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [username, setUsername] = useState("");
  
  // Balances
  const [currentBalance, setCurrentBalance] = useState(0);
  const [incomeThisMonth, setIncomeThisMonth] = useState(0);
  const [spentThisMonth, setSpentThisMonth] = useState(0);
  
  // Breakdown & Budgets
  const [categoryBreakdown, setCategoryBreakdown] = useState<[string, number][]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      if (session.user?.email) {
        const namePart = session.user.email.split("@")[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        setUsername(formattedName);
      }

      // Build date range for this month (server-side filter)
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const [balanceRes, monthTxRes, recentTxRes, bgRes] = await Promise.all([
        // 1. Calculate total balance on the server (no data transfer)
        supabase.rpc("get_balance"),
        // 2. Only fetch THIS MONTH's transactions for breakdown
        supabase.from("transactions").select("amount,category,type").gte("created_at", monthStart).lte("created_at", monthEnd),
        // 3. Only fetch the 8 most recent transactions for the list
        supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(8),
        // 4. Budgets (already small)
        supabase.from("budgets").select("category,amount")
      ]);

      if (bgRes.data && !bgRes.error) {
        const bMap: Record<string, number> = {};
        bgRes.data.forEach((b: any) => bMap[b.category] = Number(b.amount));
        setBudgets(bMap);
      }

      // Balance from server function
      if (balanceRes.data !== null && !balanceRes.error) {
        setCurrentBalance(Number(balanceRes.data));
      }

      // Recent transactions for the list
      if (recentTxRes.data && !recentTxRes.error) {
        setTransactions(recentTxRes.data);
      }

      // This month's breakdown (only month data, not all-time)
      if (monthTxRes.data && !monthTxRes.error) {
        let incMonth = 0;
        let expMonth = 0;
        const breakdown: Record<string, number> = {};

        monthTxRes.data.forEach((t: any) => {
          const type = t.type || "expense";
          if (type === "income") {
            incMonth += Number(t.amount);
          } else {
            expMonth += Number(t.amount);
            breakdown[t.category] = (breakdown[t.category] || 0) + Number(t.amount);
          }
        });

        setIncomeThisMonth(incMonth);
        setSpentThisMonth(expMonth);
        setCategoryBreakdown(Object.entries(breakdown).sort((a, b) => b[1] - a[1]));
      }
      
      setLoading(false);
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="container items-center justify-center">
        <div className="loading-pulse">
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: "6rem" }}>
      {/* Header */}
      <header className="flex justify-between items-center animate-slide-up" style={{ marginBottom: "1.5rem", paddingTop: "0.5rem" }}>
        <div>
          <p className="text-sm" style={{ marginBottom: "0.125rem" }}>Welcome back,</p>
          <h1 className="text-h2">{username || "User"} 👋</h1>
        </div>
        <button 
          className="btn-icon" 
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/login");
          }}
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* Balance Card */}
      <div className="card-static animate-slide-up stagger-1" style={{ marginBottom: "1.5rem" }}>
        <p className="text-sm" style={{ marginBottom: "0.25rem" }}>Current Balance</p>
        <h2 style={{ fontSize: "2.25rem", fontWeight: 800, margin: "0.25rem 0 1.25rem", letterSpacing: "-0.03em", color: currentBalance < 0 ? "var(--danger)" : "var(--text-primary)" }}>
          MVR {currentBalance.toFixed(2)}
        </h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div style={{ background: "var(--success-glow)", borderRadius: "var(--radius-md)", padding: "0.75rem" }}>
            <div className="flex items-center gap-1" style={{ marginBottom: "0.25rem" }}>
              <ArrowUpRight size={14} color="var(--success)" /> 
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Income</span>
              <Link href="/add-income" style={{ marginLeft: "auto", display: "flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "var(--success)", color: "white", textDecoration: "none" }}>
                <Plus size={11} />
              </Link>
            </div>
            <p style={{ fontWeight: 700, fontSize: "1.0625rem" }}>MVR {incomeThisMonth.toFixed(2)}</p>
          </div>
          <div style={{ background: "var(--danger-glow)", borderRadius: "var(--radius-md)", padding: "0.75rem" }}>
            <div className="flex items-center gap-1" style={{ marginBottom: "0.25rem" }}>
              <ArrowDownRight size={14} color="var(--danger)" />
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Spent</span>
            </div>
            <p style={{ fontWeight: 700, fontSize: "1.0625rem" }}>MVR {spentThisMonth.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Expense Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="animate-slide-up stagger-2" style={{ marginBottom: "1.5rem" }}>
          <h3 className="section-header" style={{ marginBottom: "0.75rem" }}>Spending this Month</h3>
          <div className="card-static flex flex-col gap-4">
            {categoryBreakdown.map(([catId, amount]) => {
              const cat = getCategoryDetails(catId);
              const Icon = cat.icon;
              const budgetLimit = budgets[catId] || 0;
              const hasBudget = budgetLimit > 0;
              
              let percentage = 0;
              if (hasBudget) {
                percentage = Math.min((amount / budgetLimit) * 100, 100);
              } else if (spentThisMonth > 0) {
                percentage = (amount / spentThisMonth) * 100;
              }

              const isOverBudget = hasBudget && amount > budgetLimit;
              const barColor = isOverBudget ? "var(--danger)" : cat.color;
              
              return (
                <div key={catId} className="flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <div style={{ padding: "0.375rem", borderRadius: "var(--radius-sm)", background: `${cat.color}12`, color: cat.color }}>
                        <Icon size={14} />
                      </div>
                      <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>{cat.label}</span>
                    </div>
                    <div className="text-right">
                      <span style={{ fontWeight: 600, fontSize: "0.875rem", color: isOverBudget ? "var(--danger)" : "inherit" }}>
                        MVR {amount.toFixed(2)}
                      </span>
                      {hasBudget && <span className="text-xs" style={{ marginLeft: "0.25rem" }}>/ {budgetLimit.toFixed(0)}</span>}
                    </div>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${percentage}%`, backgroundColor: barColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="animate-slide-up stagger-3">
        <div className="flex justify-between items-center" style={{ marginBottom: "0.75rem" }}>
          <h3 className="section-header">Recent Transactions</h3>
          <Link href="/transactions" style={{ fontSize: "0.75rem", color: "var(--accent-primary)", fontWeight: 600 }}>View All</Link>
        </div>
        
        {transactions.length === 0 ? (
          <div className="card-static text-center" style={{ padding: "3rem 1rem" }}>
            <p className="text-secondary" style={{ marginBottom: "0.25rem" }}>No transactions yet.</p>
            <p className="text-xs">Tap the + button to add one.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.slice(0, 8).map((t) => {
              const cat = getCategoryDetails(t.category);
              const Icon = cat.icon;
              const isIncome = (t.type || "expense") === "income";
              
              return (
                <div key={t.id} className="card-static flex items-center justify-between" style={{ padding: "0.875rem" }}>
                  <div className="flex items-center gap-3">
                    <div style={{ padding: "0.5rem", borderRadius: "var(--radius-md)", background: `${cat.color}12`, color: cat.color }}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: "0.875rem", lineHeight: 1.3 }}>{cat.label}</p>
                      {t.notes && <p className="text-xs" style={{ marginTop: "0.125rem" }}>{t.notes}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p style={{ fontWeight: 600, fontSize: "0.875rem", color: isIncome ? "var(--success)" : "var(--text-primary)" }}>
                      {isIncome ? "+" : "-"}MVR {Number(t.amount).toFixed(2)}
                    </p>
                    <p className="text-xs" style={{ marginTop: "0.125rem" }}>
                      {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <Link href="/add-transaction" className="fab" style={{ display: "flex", textDecoration: "none" }}>
        <Plus size={24} />
      </Link>
    </div>
  );
}
