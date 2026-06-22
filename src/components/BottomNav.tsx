"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PieChart, List, PiggyBank } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  // Hide on login screen
  if (pathname === "/login") return null;

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/budget", icon: PieChart, label: "Budget" },
    { href: "/savings", icon: PiggyBank, label: "Savings" },
    { href: "/transactions", icon: List, label: "History" },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive ? "active" : ""}`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
