"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, PieChart } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  // Hide on login screen
  if (pathname === "/login") return null;

  return (
    <nav style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "var(--bg-elevated)",
      borderTop: "1px solid var(--border)",
      display: "flex",
      justifyContent: "space-around",
      padding: "0.75rem 0",
      paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
      zIndex: 40,
    }}>
      <Link href="/dashboard" style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.25rem",
        color: pathname === "/dashboard" ? "var(--accent-primary)" : "var(--text-secondary)",
        textDecoration: "none"
      }}>
        <Home size={24} />
        <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>Home</span>
      </Link>

      <Link href="/budget" style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.25rem",
        color: pathname === "/budget" ? "var(--accent-primary)" : "var(--text-secondary)",
        textDecoration: "none"
      }}>
        <PieChart size={24} />
        <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>Budget</span>
      </Link>

      <Link href="/transactions" style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.25rem",
        color: pathname === "/transactions" ? "var(--accent-primary)" : "var(--text-secondary)",
        textDecoration: "none"
      }}>
        <List size={24} />
        <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>History</span>
      </Link>
    </nav>
  );
}
