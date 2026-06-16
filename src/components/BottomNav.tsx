"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, PieChart, List } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide on login screen
  if (pathname === "/login") return null;

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/budget", icon: PieChart, label: "Budget" },
    { href: "/transactions", icon: List, label: "History" },
  ];

  const activeIndex = navItems.findIndex((item) => pathname === item.href);

  // Drag state
  const navRef = useRef<HTMLElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const startX = useRef(0);
  const isDragIntent = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (!navRef.current) return;
    setIsDragging(true);
    isDragIntent.current = false;
    startX.current = e.clientX;
    
    const rect = navRef.current.getBoundingClientRect();
    const segmentWidth = rect.width / navItems.length;
    setDragX(activeIndex !== -1 ? (activeIndex * segmentWidth + segmentWidth / 2) : rect.width / 2);
    
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDragging || !navRef.current) return;
    
    if (Math.abs(e.clientX - startX.current) > 5) {
      isDragIntent.current = true;
    }
    
    if (isDragIntent.current) {
      const rect = navRef.current.getBoundingClientRect();
      setDragX(Math.max(0, Math.min(e.clientX - rect.left, rect.width)));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    
    if (isDragIntent.current && navRef.current) {
      const rect = navRef.current.getBoundingClientRect();
      const segmentWidth = rect.width / navItems.length;
      const newIndex = Math.min(navItems.length - 1, Math.max(0, Math.floor(dragX / segmentWidth)));
      if (newIndex !== activeIndex) {
        router.push(navItems[newIndex].href);
      }
    }
  };

  return (
    <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-[400px] z-50 pointer-events-none">
      <nav 
        ref={navRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative grid grid-cols-3 place-items-center w-full h-[68px] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] rounded-[2.5rem] border border-white/40 dark:border-white/10 px-2 pointer-events-auto touch-pan-y select-none"
      >
        
        {/* Sliding Indicator */}
        <div 
          className={`absolute top-1/2 w-[80px] h-[56px] rounded-full z-0 pointer-events-none ${isDragging && isDragIntent.current ? 'transition-none' : 'transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]'}`}
          style={{
            left: (isDragging && isDragIntent.current) ? `${dragX}px` : (activeIndex !== -1 ? `calc(${(activeIndex * 100) / navItems.length}% + ${(100 / navItems.length) / 2}%)` : '50%'),
            transform: 'translate(-50%, -50%)',
            opacity: activeIndex !== -1 || isDragging ? 1 : 0,
            scale: isDragging ? 1.15 : (activeIndex !== -1 ? 1 : 0.8)
          }}
        >
          {/* Subtle liquid glass iridescent glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-200 via-fuchsia-300 to-yellow-200 dark:from-cyan-600 dark:via-fuchsia-700 dark:to-yellow-600 blur-[8px] opacity-50 scale-105" />
          
          {/* Gradient border effect */}
          <div className="absolute inset-0 rounded-full p-[1.5px] bg-gradient-to-tr from-cyan-300 via-fuchsia-300 to-yellow-300 dark:from-cyan-500 dark:via-fuchsia-500 dark:to-yellow-500 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
            <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-full" />
          </div>
          
          {/* Inner glass highlight */}
          <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)]" />
        </div>

        {/* Nav Items */}
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = index === activeIndex;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              draggable={false}
              onClick={(e) => {
                if (isDragIntent.current) {
                  e.preventDefault();
                }
              }}
              className="relative z-10 flex flex-col items-center justify-center w-full h-full group outline-none"
            >
              <div className={`flex flex-col items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isActive && !isDragging ? "-translate-y-1 scale-105" : "group-hover:scale-105"}`}>
                <Icon 
                  size={isActive ? 22 : 20} 
                  className={`mb-1 transition-colors duration-300 ${isActive ? "text-success" : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200"}`} 
                  strokeWidth={isActive ? 2.5 : 2} 
                />
                <span className={`text-[11px] transition-colors duration-300 ${isActive ? "text-success font-bold tracking-wide" : "text-zinc-500 dark:text-zinc-400 font-medium"}`}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
