"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Plus, LogOut, Home, ShoppingCart, Zap, CreditCard, Droplet, Coffee, ArrowUpRight, ArrowDownRight, Briefcase, Gift, Wallet, X } from "lucide-react";
import Link from "next/link";

type Transaction = {
  id: string;
  amount: number;
  category: string;
  notes: string | null;
  created_at: string;
  type: "income" | "expense";
};

const getCategoryDetails = (category: string) => {
  switch (category) {
    case "utilities": return { icon: Zap, color: "#f59e0b", label: "Utilities" };
    case "groceries": return { icon: ShoppingCart, color: "#10b981", label: "Groceries" };
    case "subscriptions": return { icon: CreditCard, color: "#8b5cf6", label: "Subscriptions" };
    case "fuel": return { icon: Droplet, color: "#ef4444", label: "Fuel" };
    case "loans": return { icon: Home, color: "#3b82f6", label: "Loans" };
    case "salary": return { icon: Briefcase, color: "#10b981", label: "Salary" };
    case "gift": return { icon: Gift, color: "#f59e0b", label: "Gift" };
    case "opening_balance": return { icon: Wallet, color: "#3b82f6", label: "Opening Balance" };
    default: return { icon: Coffee, color: "#a1a1aa", label: "Other" };
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Balances
  const [currentBalance, setCurrentBalance] = useState(0);
  const [incomeThisMonth, setIncomeThisMonth] = useState(0);
  const [spentThisMonth, setSpentThisMonth] = useState(0);
  
  // Breakdown
  const [categoryBreakdown, setCategoryBreakdown] = useState<[string, number][]>([]);
  
  // UI State
  const [showActionMenu, setShowActionMenu] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Fetch all transactions to calculate full balance
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && !error) {
        setTransactions(data);
        
        // Calculate Total Balance (all time)
        const balance = data.reduce((acc, curr) => {
          // If type is missing, treat as expense for backward compatibility
          const type = curr.type || "expense";
          return type === "income" ? acc + Number(curr.amount) : acc - Number(curr.amount);
        }, 0);
        setCurrentBalance(balance);

        // Calculate this month's stats
        const now = new Date();
        const thisMonth = data.filter(t => {
          const d = new Date(t.created_at);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        
        let incMonth = 0;
        let expMonth = 0;
        const breakdown: Record<string, number> = {};

        thisMonth.forEach(t => {
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
    return <div className="container items-center justify-center"><p className="text-secondary">Loading...</p></div>;
  }

  return (
    <div className="container animate-slide-up" style={{ position: "relative", paddingBottom: "80px" }}>
      {/* Header */}
      <header className="flex justify-between items-center" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="text-h2">Dashboard</h1>
          <p className="text-sm">Welcome back!</p>
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

      {/* Main Balance Card */}
      <div className="card" style={{ marginBottom: "2rem", background: "linear-gradient(135deg, var(--bg-elevated), var(--bg-secondary))", border: "1px solid var(--border)" }}>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Current Balance</p>
        <h2 style={{ fontSize: "2.5rem", fontWeight: 700, margin: "0.5rem 0", color: currentBalance < 0 ? "var(--danger)" : "var(--text-primary)" }}>
          MVR {currentBalance.toFixed(2)}
        </h2>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
          <div>
            <div className="flex items-center gap-1 text-sm mb-1 text-success">
              <ArrowUpRight size={16} /> Income
            </div>
            <p style={{ fontWeight: 600 }}>MVR {incomeThisMonth.toFixed(2)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-sm mb-1 text-danger">
              <ArrowDownRight size={16} /> Spent
            </div>
            <p style={{ fontWeight: 600 }}>MVR {spentThisMonth.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Expense Category Breakdown (Only show if there are expenses this month) */}
      {categoryBreakdown.length > 0 && (
        <div className="flex flex-col gap-3" style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontWeight: 600 }}>Spending this Month</h3>
          <div className="card flex flex-col gap-4">
            {categoryBreakdown.map(([catId, amount]) => {
              const cat = getCategoryDetails(catId);
              const Icon = cat.icon;
              const percentage = spentThisMonth > 0 ? (amount / spentThisMonth) * 100 : 0;
              
              return (
                <div key={catId} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <Icon size={16} color={cat.color} />
                      <span style={{ fontWeight: 500 }}>{cat.label}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>MVR {amount.toFixed(2)}</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", backgroundColor: "var(--border)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                    <div style={{ width: `${percentage}%`, height: "100%", backgroundColor: cat.color, borderRadius: "var(--radius-full)", transition: "width 0.5s ease" }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 style={{ fontWeight: 600 }}>Recent Transactions</h3>
          <button style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.875rem" }}>View All</button>
        </div>
        
        {transactions.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-secondary)" }}>
            <p>No transactions yet.</p>
            <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Tap the + button to add one.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {transactions.slice(0, 10).map((t) => {
              const cat = getCategoryDetails(t.category);
              const Icon = cat.icon;
              const isIncome = (t.type || "expense") === "income";
              
              return (
                <div key={t.id} className="card flex items-center justify-between" style={{ padding: "1rem" }}>
                  <div className="flex items-center gap-3">
                    <div style={{ padding: "0.5rem", borderRadius: "var(--radius-full)", background: `${cat.color}15`, color: cat.color }}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: "0.95rem" }}>{cat.label}</p>
                      {t.notes && <p className="text-sm" style={{ fontSize: "0.8rem", marginTop: "0.1rem" }}>{t.notes}</p>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontWeight: 600, color: isIncome ? "var(--success)" : "var(--text-primary)" }}>
                      {isIncome ? "+" : "-"}MVR {Number(t.amount).toFixed(2)}
                    </p>
                    <p className="text-sm" style={{ fontSize: "0.75rem", marginTop: "0.1rem" }}>
                      {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Menu Backdrop */}
      {showActionMenu && (
        <div 
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 40 }}
          onClick={() => setShowActionMenu(false)}
        />
      )}

      {/* Action Menu Items */}
      {showActionMenu && (
        <div className="animate-slide-up" style={{ position: "fixed", bottom: "6rem", right: "2rem", zIndex: 50, display: "flex", flexDirection: "column", gap: "1rem", alignItems: "flex-end" }}>
          <Link href="/add-income" className="flex items-center gap-3">
            <span style={{ backgroundColor: "var(--bg-elevated)", padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", fontWeight: 500, boxShadow: "var(--shadow-md)" }}>
              Add Income
            </span>
            <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", backgroundColor: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "var(--shadow-md)" }}>
              <ArrowUpRight size={20} />
            </div>
          </Link>
          <Link href="/add-transaction" className="flex items-center gap-3">
            <span style={{ backgroundColor: "var(--bg-elevated)", padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", fontWeight: 500, boxShadow: "var(--shadow-md)" }}>
              Add Expense
            </span>
            <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", backgroundColor: "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "var(--shadow-md)" }}>
              <ArrowDownRight size={20} />
            </div>
          </Link>
        </div>
      )}

      {/* FAB */}
      <button 
        className="fab" 
        onClick={() => setShowActionMenu(!showActionMenu)}
        style={{ transform: showActionMenu ? "rotate(45deg)" : "none", transition: "transform 0.2s ease" }}
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
