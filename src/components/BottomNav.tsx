"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PieChart, List } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  // Hide on login screen
  if (pathname === "/login") return null;

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/budget", icon: PieChart, label: "Budget" },
    { href: "/transactions", icon: List, label: "History" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/70 backdrop-blur-xl border-t border-border flex justify-around p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-40">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 text-[0.6875rem] font-medium px-5 py-2 rounded-full transition-all duration-300 relative ${
              isActive 
                ? "text-success bg-background -translate-y-2 scale-105 shadow-[0_-3px_10px_rgba(99,102,241,0.15),0_3px_10px_rgba(16,185,129,0.15),inset_0_2px_4px_rgba(255,255,255,0.7)] dark:shadow-[0_-3px_10px_rgba(99,102,241,0.3),0_3px_10px_rgba(16,185,129,0.3),inset_0_1px_2px_rgba(255,255,255,0.1)]" 
                : "text-muted hover:text-foreground"
            }`}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
