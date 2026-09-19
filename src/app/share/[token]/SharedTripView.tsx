"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";

export type SharedExpense = {
  id: string;
  title: string;
  amount_minor: number;
  currency: string;
  spent_at: string;
};

export type SharedTrip = {
  name: string;
  description: string | null;
  route: string | null;
  start_date: string | null;
  end_date: string | null;
  base_currency: string;
};

export type SharedPayload = {
  trip: SharedTrip;
  expenses: SharedExpense[];
};

function categoryFor(title: string) {
  if (/train|รถไฟ|taxi|bus|bike|transport|tram/i.test(title)) return "Transport";
  if (/shop|market|supermarket|ซื้อ|ของ|souvenir/i.test(title)) return "Shopping";
  if (/coffee|coke|food|eat|gelato|ข้าว|น้ำ|dinner|lunch/i.test(title)) return "Food";
  return "Other";
}

function money(minor: number, currency: string) {
  return `${currency === "THB" ? "฿" : `${currency} `}${(minor / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(`${value}T12:00:00`).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SharedTripView({ payload }: { payload: SharedPayload }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "amount">("newest");
  const expenses = payload.expenses;
  const categories = ["All", ...new Set(expenses.map((expense) => categoryFor(expense.title)))];
  const filteredExpenses = useMemo(() => expenses
    .filter((expense) => !query.trim() || expense.title.toLowerCase().includes(query.trim().toLowerCase()))
    .filter((expense) => category === "All" || categoryFor(expense.title) === category)
    .sort((first, second) => {
      if (sortOrder === "amount") return Number(second.amount_minor) - Number(first.amount_minor);
      const difference = new Date(second.spent_at).getTime() - new Date(first.spent_at).getTime();
      return sortOrder === "newest" ? difference : -difference;
    }), [category, expenses, query, sortOrder]);
  const categoriesTotal = expenses.reduce<Record<string, number>>((summary, expense) => {
    const expenseCategory = categoryFor(expense.title);
    summary[expenseCategory] = (summary[expenseCategory] || 0) + Number(expense.amount_minor);
    return summary;
  }, {});
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount_minor), 0);
  const startDate = formatDate(payload.trip.start_date);
  const endDate = formatDate(payload.trip.end_date);
  const dates = [startDate, endDate].filter(Boolean).join(" – ");

  return (
    <main className="share-shell">
      <div className="share-content">
        <header className="share-header">
          <div>
            <p className="eyebrow">MILEMARK · READ ONLY</p>
            <h1>{payload.trip.name}</h1>
            <p className="muted">{payload.trip.route || dates || "Shared trip"}</p>
            {payload.trip.description && <p className="share-description">{payload.trip.description}</p>}
          </div>
          <div className="share-lock">READ ONLY</div>
        </header>

        <section className="share-period" aria-label="Trip period">
          <CalendarDays size={20} strokeWidth={1.8} />
          <div>
            <span>Trip period</span>
            <strong>{dates || "Dates not set"}</strong>
          </div>
        </section>

        <section className="share-total">
          <span>Total recorded</span>
          <strong>{money(total, payload.trip.base_currency)}</strong>
          <small>{expenses.length} expenses</small>
        </section>

        <section className="share-section">
          <div className="section-heading">
            <h2>By category</h2>
            <span>{dates || "Trip summary"}</span>
          </div>
          <div className="share-category-list">
            {Object.entries(categoriesTotal).map(([expenseCategory, amount]) => (
              <div className="share-category-row" key={expenseCategory}>
                <span>{expenseCategory}</span>
                <strong>{money(amount, payload.trip.base_currency)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="share-section">
          <div className="section-heading">
            <h2>Expenses</h2>
            <span>{filteredExpenses.length} / {expenses.length} items</span>
          </div>
          <div className="share-controls">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search expenses" aria-label="Search shared expenses" />
            <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter shared expenses by category">
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)} aria-label="Sort shared expenses">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="amount">Highest amount</option>
            </select>
          </div>
          <div className="share-expense-list">
            {filteredExpenses.length ? filteredExpenses.map((expense) => (
              <article className="share-expense-row" key={expense.id}>
                <div>
                  <strong>{expense.title}</strong>
                  <span>{categoryFor(expense.title)} · {new Date(expense.spent_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                <b>{money(Number(expense.amount_minor), expense.currency)}</b>
              </article>
            )) : <p className="empty-state">No matching expenses.</p>}
          </div>
        </section>
        <p className="share-footer">This is a read-only view. The owner controls the original trip.</p>
      </div>
    </main>
  );
}
