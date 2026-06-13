export type Transaction = {
  id: string;
  amount: number;
  category: string;
  notes: string | null;
  created_at: string;
  type: "income" | "expense";
};

export type Budget = {
  id: string;
  user_id: string;
  category: string;
  amount: number;
};
