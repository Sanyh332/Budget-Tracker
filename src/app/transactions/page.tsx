"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";
import { getCategoryDetails } from "@/utils/categories";
import { Transaction } from "@/utils/types";

export default function TransactionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (data && !error) {
        setTransactions(data);
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

  // Group by month/year
  const grouped = transactions.reduce((acc, t) => {
    const date = new Date(t.created_at);
    const monthYear = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="container animate-slide-up" style={{ paddingBottom: "6rem" }}>
      <header style={{ marginBottom: "1.5rem", paddingTop: "0.5rem" }}>
        <h1 className="text-h2">History</h1>
        <p className="text-sm" style={{ marginTop: "0.25rem" }}>Tap any transaction to edit or delete.</p>
      </header>

      {transactions.length === 0 ? (
        <div className="card-static text-center" style={{ padding: "3rem 1rem" }}>
          <p className="text-secondary" style={{ marginBottom: "0.25rem" }}>No transactions found.</p>
          <p className="text-xs">Start by adding your first expense.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([monthYear, items], groupIdx) => (
            <div key={monthYear} className={`flex flex-col gap-2 animate-slide-up stagger-${Math.min(groupIdx + 1, 5)}`}>
              <div className="flex items-center gap-2" style={{ marginBottom: "0.25rem" }}>
                <h3 className="section-header">{monthYear}</h3>
                <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
              </div>
              <div className="flex flex-col gap-2">
                {items.map((t) => {
                  const cat = getCategoryDetails(t.category);
                  const Icon = cat.icon;
                  const isIncome = (t.type || "expense") === "income";
                  
                  return (
                    <Link href={`/edit-transaction/${t.id}`} key={t.id} style={{ textDecoration: "none" }}>
                      <div className="card-static flex items-center justify-between" style={{ padding: "0.875rem", cursor: "pointer" }}>
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
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
