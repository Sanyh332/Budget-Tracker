"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";
import { getCategoryDetails } from "@/utils/categories";
import { Transaction } from "@/utils/types";
import { GlassCard } from "@glinui/ui";

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
      <div className="flex w-full max-w-md mx-auto p-4 min-h-screen items-center justify-center">
        <div className="animate-pulse">
          <p className="text-muted">Loading...</p>
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
    <div className="w-full max-w-md mx-auto flex flex-col p-4 pb-24 min-h-screen animate-slide-up">
      <header className="mb-6 pt-2">
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <p className="text-sm text-muted mt-1">Tap any transaction to edit or delete.</p>
      </header>

      {transactions.length === 0 ? (
        <GlassCard className="text-center py-12 px-4">
          <p className="text-muted font-medium mb-1">No transactions found.</p>
          <p className="text-xs text-muted/70">Start by adding your first expense.</p>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([monthYear, items], groupIdx) => (
            <div key={monthYear} className={`flex flex-col gap-3 animate-slide-up stagger-${Math.min(groupIdx + 1, 5)}`}>
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">{monthYear}</h3>
                <div className="flex-1 h-px bg-border" />
              </div>
              <GlassCard className="p-1 flex flex-col gap-1">
                {items.map((t, idx) => {
                  const cat = getCategoryDetails(t.category);
                  const Icon = cat.icon;
                  const isIncome = (t.type || "expense") === "income";
                  
                  return (
                    <Link href={`/edit-transaction/${t.id}`} key={t.id} className="block">
                      <div className="flex items-center justify-between p-3 rounded-xl hover:bg-foreground/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-background/50 border border-border shadow-sm">
                            <Icon size={18} color={cat.color} />
                          </div>
                          <div>
                            <p className="font-medium text-sm leading-tight text-foreground">{cat.label}</p>
                            {t.notes && <p className="text-xs text-muted mt-0.5">{t.notes}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-sm ${isIncome ? "text-success" : "text-foreground"}`}>
                            {isIncome ? "+" : "-"}MVR {Number(t.amount).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted mt-0.5">
                            {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </GlassCard>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
