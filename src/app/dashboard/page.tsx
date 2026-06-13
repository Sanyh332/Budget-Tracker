"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Plus, LogOut, Home, ShoppingCart, Zap, CreditCard, Droplet, Coffee } from "lucide-react";
import Link from "next/link";

type Transaction = {
  id: string;
  amount: number;
  category: string;
  notes: string | null;
  created_at: string;
};

const getCategoryDetails = (category: string) => {
  switch (category) {
    case "utilities": return { icon: Zap, color: "#f59e0b", label: "Utilities" };
    case "groceries": return { icon: ShoppingCart, color: "#10b981", label: "Groceries" };
    case "subscriptions": return { icon: CreditCard, color: "#8b5cf6", label: "Subscriptions" };
    case "fuel": return { icon: Droplet, color: "#ef4444", label: "Fuel" };
    case "loans": return { icon: Home, color: "#3b82f6", label: "Loans" };
    default: return { icon: Coffee, color: "#a1a1aa", label: "Other" };
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Fetch transactions
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && !error) {
        setTransactions(data);
        
        // Calculate this month's total
        const now = new Date();
        const thisMonth = data.filter(t => {
          const d = new Date(t.created_at);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        
        const sum = thisMonth.reduce((acc, curr) => acc + Number(curr.amount), 0);
        setTotal(sum);
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

      {/* Monthly Summary Card */}
      <div className="card" style={{ marginBottom: "2rem", background: "linear-gradient(135deg, var(--accent-primary), var(--accent-hover))", color: "white", border: "none" }}>
        <p style={{ fontSize: "0.875rem", opacity: 0.9 }}>Total Spend this Month</p>
        <h2 style={{ fontSize: "2.5rem", fontWeight: 700, margin: "0.5rem 0" }}>${total.toFixed(2)}</h2>
        <p style={{ fontSize: "0.875rem", opacity: 0.9 }}>{transactions.length} total transactions</p>
      </div>

      {/* Categories / Recent */}
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
                    <p style={{ fontWeight: 600 }}>-${Number(t.amount).toFixed(2)}</p>
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

      {/* FAB */}
      <Link href="/add-transaction" className="fab">
        <Plus size={24} />
      </Link>
    </div>
  );
}
