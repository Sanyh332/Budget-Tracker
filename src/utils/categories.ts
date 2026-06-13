import { 
  Zap, ShoppingCart, CreditCard, Droplet, Home, Coffee, 
  Briefcase, Gift, Wallet, Utensils, Wrench, Gamepad2, GraduationCap, Users 
} from "lucide-react";

export const EXPENSE_CATEGORIES = [
  { id: "utilities", label: "Utilities", icon: Zap, color: "#f59e0b" },
  { id: "groceries", label: "Groceries", icon: ShoppingCart, color: "#10b981" },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard, color: "#8b5cf6" },
  { id: "fuel", label: "Fuel", icon: Droplet, color: "#ef4444" },
  { id: "loans", label: "Loans", icon: Home, color: "#3b82f6" },
  { id: "eating_out", label: "Eating Out", icon: Utensils, color: "#ec4899" },
  { id: "home_upgrades", label: "Home Upgrades", icon: Wrench, color: "#06b6d4" },
  { id: "gaming", label: "Gaming/Ent.", icon: Gamepad2, color: "#6366f1" },
  { id: "school_fees", label: "School Fees", icon: GraduationCap, color: "#f43f5e" },
  { id: "family", label: "Family Exp.", icon: Users, color: "#d946ef" },
  { id: "coffee", label: "Coffee", icon: Coffee, color: "#8B4513" },
  { id: "other", label: "Other", icon: Coffee, color: "#a1a1aa" },
];

export const INCOME_CATEGORIES = [
  { id: "salary", label: "Salary", icon: Briefcase, color: "#10b981" },
  { id: "gift", label: "Gift", icon: Gift, color: "#f59e0b" },
  { id: "opening_balance", label: "Opening Balance", icon: Wallet, color: "#3b82f6" },
];

export const getCategoryDetails = (category: string) => {
  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  return allCategories.find((c) => c.id === category) || { icon: Coffee, color: "#a1a1aa", label: "Other" };
};
