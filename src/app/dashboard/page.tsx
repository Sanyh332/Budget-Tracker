"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Plus, LogOut, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";
import { getCategoryDetails } from "@/utils/categories";
import { Transaction } from "@/utils/types";
import { GlassCard, Button } from "@glinui/ui";

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
        supabase.rpc("get_balance"),
        supabase.from("transactions").select("amount,category,type").gte("created_at", monthStart).lte("created_at", monthEnd),
        supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(8),
        supabase.from("budgets").select("category,amount")
      ]);

      if (bgRes.data && !bgRes.error) {
        const bMap: Record<string, number> = {};
        bgRes.data.forEach((b: any) => bMap[b.category] = Number(b.amount));
        setBudgets(bMap);
      }

      if (balanceRes.data !== null && !balanceRes.error) {
        setCurrentBalance(Number(balanceRes.data));
      }

      if (recentTxRes.data && !recentTxRes.error) {
        setTransactions(recentTxRes.data);
      }

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
      <div className="flex w-full max-w-md mx-auto p-4 min-h-screen items-center justify-center">
        <div className="animate-pulse">
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col p-4 pb-24 min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 pt-2">
        <div>
          <p className="text-sm text-muted mb-0.5">Welcome back,</p>
          <h1 className="text-2xl font-bold">{username || "User"} 👋</h1>
        </div>
        <Button 
          variant="ghost" 
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/login");
          }}
          className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
        >
          <LogOut size={20} className="text-muted" />
        </Button>
      </header>

      {/* Balance Card */}
      <GlassCard className="mb-6 p-6">
        <p className="text-sm text-muted mb-1">Current Balance</p>
        <h2 className={`text-4xl font-extrabold mb-5 tracking-tight ${currentBalance < 0 ? "text-destructive" : "text-foreground"}`}>
          MVR {currentBalance.toFixed(2)}
        </h2>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-success/10 rounded-xl p-3 border border-success/20">
            <div className="flex items-center gap-1 mb-1">
              <ArrowUpRight size={14} className="text-success" /> 
              <span className="text-xs text-muted">Income</span>
              <Link href="/add-income" className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full bg-success text-white shadow-sm hover:scale-105 transition-transform">
                <Plus size={12} strokeWidth={3} />
                <span className="text-[10px] font-bold tracking-wider">ADD</span>
              </Link>
            </div>
            <p className="font-bold text-lg text-foreground">MVR {incomeThisMonth.toFixed(2)}</p>
          </div>
          <div className="bg-destructive/10 rounded-xl p-3 border border-destructive/20">
            <div className="flex items-center gap-1 mb-1">
              <ArrowDownRight size={14} className="text-destructive" />
              <span className="text-xs text-muted">Spent</span>
            </div>
            <p className="font-bold text-lg text-foreground">MVR {spentThisMonth.toFixed(2)}</p>
          </div>
        </div>
      </GlassCard>

      {/* Expense Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Spending this Month</h3>
          <GlassCard className="flex flex-col gap-4 p-4">
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
              const barColor = isOverBudget ? "var(--color-destructive)" : cat.color;
              
              return (
                <div key={catId} className="flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-background/50 border border-border">
                        <Icon size={16} color={cat.color} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{cat.label}</p>
                        {hasBudget && (
                          <p className="text-xs text-muted">
                            MVR {amount.toFixed(0)} / {budgetLimit}
                          </p>
                        )}
                      </div>
                    </div>
                    {!hasBudget && (
                      <p className="font-semibold text-sm text-foreground">MVR {amount.toFixed(0)}</p>
                    )}
                  </div>
                  
                  <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: barColor 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </GlassCard>
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-end mb-3">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Recent Transactions</h3>
          <Link href="/transactions" className="text-xs text-accent font-medium hover:underline">
            View All
          </Link>
        </div>

        {transactions.length === 0 ? (
          <GlassCard className="p-6 text-center">
            <p className="text-muted text-sm mb-4">No transactions yet.</p>
            <div className="flex gap-3">
              <Link href="/add-income" className="flex-1">
                <Button variant="liquid" className="w-full !bg-success text-white shadow-[0_8px_32px_var(--success-glow)] border-none">Add Income</Button>
              </Link>
              <Link href="/add-transaction" className="flex-1">
                <Button variant="liquid" className="w-full">Add Expense</Button>
              </Link>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="flex flex-col gap-1 p-2">
            {transactions.map((t) => {
              const cat = getCategoryDetails(t.category);
              const Icon = cat.icon;
              const type = t.type || "expense";
              const isIncome = type === "income";

              return (
                <Link key={t.id} href={`/edit-transaction/${t.id}`} className="block">
                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-foreground/5 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-background/50 border border-border shadow-sm">
                        <Icon size={18} color={cat.color} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{cat.label}</p>
                        <p className="text-xs text-muted">
                          {new Date(t.created_at).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short"
                          })} 
                          {t.notes ? ` • ${t.notes}` : ""}
                        </p>
                      </div>
                    </div>
                    <p className={`font-bold text-sm ${isIncome ? "text-success" : "text-foreground"}`}>
                      {isIncome ? "+" : "-"}MVR {Number(t.amount).toFixed(2)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </GlassCard>
        )}
      </div>

      {/* Floating Action Button */}
      <Link href="/add-transaction" className="fixed bottom-[calc(7.5rem+env(safe-area-inset-bottom))] right-6 w-14 h-14 rounded-full flex items-center justify-center z-50 group transition-all duration-300 hover:scale-110 hover:-translate-y-1">
        {/* Main liquid glass background */}
        <div className="absolute inset-0 rounded-full bg-white/20 dark:bg-zinc-900/30 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] border-[1.5px] border-white/60 dark:border-white/20" />
        {/* Gloss reflection layer */}
        <div className="absolute inset-0 rounded-full backdrop-blur-[2px] opacity-40 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
        {/* Subtle shadow glow behind */}
        <div className="absolute inset-0 rounded-full bg-black/5 dark:bg-white/5 blur-[8px] -z-10" />
        
        <Plus size={24} className="relative z-10 text-foreground dark:text-white group-hover:scale-110 transition-transform" />
      </Link>
    </div>
  );
}
