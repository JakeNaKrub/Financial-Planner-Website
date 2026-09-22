export type ExpenseStatus = "not_requested" | "requesting" | "settled";
export type ExpenseIcon = "food" | "train" | "shop" | "attraction" | "other";

export type Expense = {
  id: string | number;
  tripId: string | number;
  title: string;
  note?: string;
  amountCents: number;
  myCostCents: number;
  owedCents: number;
  category: string;
  icon: ExpenseIcon;
  people?: number;
  isExcluded?: boolean;
  time: string;
  date: string;
  spentAt?: string;
  splitStatus: ExpenseStatus;
};

export type Trip = {
  id: string | number;
  name: string;
  route: string;
  dates: string;
  budgetCents?: number;
  description?: string;
  shareToken?: string;
};

