import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpendTracker | Money Management",
  description: "A fast, premium money management app for tracking expenses on the go.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SpendTracker",
  },
};

import BottomNav from "@/components/BottomNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
