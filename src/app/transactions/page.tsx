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
        .order("created_at", { ascending: false });

      if (data && !error) {
        setTransactions(data);
      }
      setLoading(false);
    };

    fetchData();
  }, [router]);

  if (loading) {
    return <div className="container items-center justify-center"><p className="text-secondary">Loading...</p></div>;
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
    <div className="container animate-slide-up" style={{ paddingBottom: "100px" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 className="text-h2">Transaction History</h1>
        <p className="text-sm">Tap any transaction to edit or delete.</p>
      </header>

      {transactions.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-secondary)" }}>
          <p>No transactions found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([monthYear, items]) => (
            <div key={monthYear} className="flex flex-col gap-3">
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {monthYear}
              </h3>
              <div className="flex flex-col gap-3">
                {items.map((t) => {
                  const cat = getCategoryDetails(t.category);
                  const Icon = cat.icon;
                  const isIncome = (t.type || "expense") === "income";
                  
                  return (
                    <Link href={`/edit-transaction/${t.id}`} key={t.id} style={{ textDecoration: "none" }}>
                      <div className="card flex items-center justify-between" style={{ padding: "1rem", cursor: "pointer" }}>
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
