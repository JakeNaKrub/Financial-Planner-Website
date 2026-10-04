"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronRight,
  CircleDollarSign,
  Coffee,
  Compass,
  History,
  MapPin,
  MoreHorizontal,
  Pencil,
  Printer,
  Plus,
  Receipt,
  Share2,
  Sparkles,
  Trash2,
  TrainFront,
  WalletCards,
  X,
} from "lucide-react";
import {
  type Expense,
  type ExpenseStatus,
  type Income,
  type Trip,
} from "@/lib/demo-data";
import {
  detectExpenseCategory,
  expenseCategoryNames,
  getExpenseCategoryInfo,
} from "@/lib/expense-category";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type AppCurrency = "THB" | "USD" | "EUR" | "GBP" | "JPY" | "KRW";

const currencySymbols: Record<AppCurrency, string> = {
  THB: "฿",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  KRW: "₩",
};

const money = (cents: number, currency: AppCurrency = "THB") =>
  `${currencySymbols[currency]}${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const monthNumbers: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  sept: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function parseDateHeading(raw: string) {
  const match = raw
    .replace(/[*_]/g, "")
    .trim()
    .match(/^(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)(?:\s+(\d{4}))?$/i);
  if (!match) return null;
  const year = Number(match[3] || new Date().getFullYear());
  const date = new Date(year, monthNumbers[match[2].toLowerCase()], Number(match[1]), 12);
  return {
    label: date.toLocaleDateString([], { month: "short", day: "numeric" }),
    iso: date.toISOString(),
  };
}

function parseExpense(
  raw: string,
  tripId: string | number,
  date = "Today",
  spentAt = new Date().toISOString(),
): Expense | null {
  const cleanedRaw = raw.replace(/[*_]/g, "").trim();
  if (parseDateHeading(cleanedRaw)) return null;
  if (/^income(?:\s|$)/i.test(cleanedRaw)) return null;
  const amountMatches = cleanedRaw.match(
    /(?<!\/)(?:฿|\$)?\s*\d+(?:[.,]\d{1,2})?(?=\s*(?:บาท|baht|euro|eur)\b|\s|$|[,+])/giu,
  );
  if (!amountMatches?.length) return null;
  const amountCents = amountMatches.reduce(
    (total, value) =>
      total + Math.round(Number(value.replace(/[^\d.,]/g, "").replace(",", ".")) * 100),
    0,
  );
  const peopleMatch = cleanedRaw.match(/\/(\d+)/);
  const thaiPeopleMatch = cleanedRaw.match(/(สอง|สาม|สี่|ห้า|2|3|4|5)\s*คน/);
  const people = peopleMatch
    ? Number(peopleMatch[1])
    : thaiPeopleMatch
      ? { สอง: 2, สาม: 3, สี่: 4, ห้า: 5 }[thaiPeopleMatch[1]] || Number(thaiPeopleMatch[1])
      : /หารกัน|หารเท่า|shared/i.test(cleanedRaw)
        ? 2
        : 1;
  const excluded = /-\s*me|เราไม่ต้องจ่าย|เราไม่ได้กิน|เราเอง/i.test(cleanedRaw);
  const body = raw
    .replace(/(?<!\/)(?:฿|\$)?\s*\d+(?:[.,]\d{1,2})?(?=\s*(?:บาท|baht|euro|eur)\b|\s|$|[,+])/giu, "")
    .replace(/\s*\/\s*\d+/g, "")
    .replace(/-\s*me/i, "")
    .replace(/เราไม่ต้องจ่าย|เราไม่ได้กิน|เราเอง/gu, "")
    .replace(/[📍✅*_]/gu, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\+|,/g, " ")
    .trim();
  const title = body || "Expense";
  const { category, icon } = detectExpenseCategory(title);
  const myCostCents = excluded ? 0 : Math.floor(amountCents / people);
  return {
    id: Date.now() + Math.random(),
    tripId,
    title: title.charAt(0).toUpperCase() + title.slice(1),
    note:
      people > 1
        ? `${people} people shared${excluded ? " · you excluded" : ""}`
        : undefined,
    amountCents,
    myCostCents,
    owedCents: amountCents - myCostCents,
    category,
    icon,
    people: people > 1 ? people : undefined,
    time: "Just now",
    date,
    spentAt,
    splitStatus: "not_requested",
  };
}

function parseIncome(
  raw: string,
  tripId: string | number,
  receivedAt = new Date().toISOString(),
): Income | null {
  const cleanedRaw = raw.replace(/[*_]/g, "").trim();
  const match = cleanedRaw.match(
    /^income\s+(฿\s*)?((?:\d{1,3}(?:,\d{3})+|\d+)(?:[.,]\d{1,2})?)(?:\s+(?:baht|บาท))?(?:\s+(.+))?$/iu,
  );
  if (!match) return null;
  const amountRaw = match[2];
  const normalizedAmount = amountRaw.includes(".")
    ? amountRaw.replace(/,/g, "")
    : amountRaw.includes(",") && !/,\d{1,2}$/.test(amountRaw)
      ? amountRaw.replace(/,/g, "")
      : amountRaw.replace(",", ".");
  const amountCents = Math.round(Number(normalizedAmount) * 100);
  if (!Number.isFinite(amountCents) || amountCents <= 0) return null;
  return {
    id: Date.now() + Math.random(),
    tripId,
    source: match[3]?.trim() || "Income",
    amountCents,
    receivedAt,
  };
}

function ExpenseIcon({ type }: { type: Expense["icon"] }) {
  const Icon =
    type === "train"
      ? TrainFront
      : type === "shop"
        ? WalletCards
        : type === "food"
          ? Coffee
          : type === "attraction"
            ? MapPin
          : Receipt;
  return <Icon size={18} strokeWidth={1.8} />;
}

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileName, setProfileName] = useState(() =>
    typeof window === "undefined"
      ? "Arun K."
      : localStorage.getItem("milemark-profile-name") || "Arun K.",
  );
  const [currency, setCurrency] = useState<AppCurrency>(() => {
    if (typeof window === "undefined") return "THB";
    const savedCurrency = localStorage.getItem("milemark-currency") as AppCurrency | null;
    return savedCurrency && savedCurrency in currencySymbols ? savedCurrency : "THB";
  });
  const [activeTab, setActiveTab] = useState("Today");
  const [input, setInput] = useState(() =>
    typeof window === "undefined" ? "" : localStorage.getItem("fintrack-expense-draft") || "",
  );
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [incomeError, setIncomeError] = useState("");
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [editIncomeSource, setEditIncomeSource] = useState("");
  const [editIncomeAmount, setEditIncomeAmount] = useState("");
  const [entryError, setEntryError] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | number>("");
  const [dataSource, setDataSource] = useState<"demo" | "supabase">("demo");
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editExpenseTitle, setEditExpenseTitle] = useState("");
  const [editExpenseNote, setEditExpenseNote] = useState("");
  const [editExpenseAmount, setEditExpenseAmount] = useState("");
  const [editExpensePeople, setEditExpensePeople] = useState("1");
  const [editExpenseExcluded, setEditExpenseExcluded] = useState(false);
    const [editExpenseCategory, setEditExpenseCategory] = useState("Other");
    useEffect(() => {
      const updateOnlineState = () => setIsOnline(navigator.onLine);
      window.addEventListener("online", updateOnlineState);
      window.addEventListener("offline", updateOnlineState);
      return () => {
        window.removeEventListener("online", updateOnlineState);
        window.removeEventListener("offline", updateOnlineState);
      };
    }, []);

    useEffect(() => {
      if (input) localStorage.setItem("fintrack-expense-draft", input);
      else localStorage.removeItem("fintrack-expense-draft");
    }, [input]);
  function updateProfileName(name: string) {
    const nextName = name.trim() || "Arun K.";
    setProfileName(nextName);
    localStorage.setItem("milemark-profile-name", nextName);
  }
  function updateCurrency(nextCurrency: AppCurrency) {
    setCurrency(nextCurrency);
    localStorage.setItem("milemark-currency", nextCurrency);
  }
  const preview = useMemo(
    () => (/^income(?:\s|$)/i.test(input.trim()) ? null : parseExpense(input, activeTripId)),
    [input, activeTripId],
  );
  const incomePreview = useMemo(
    () => parseIncome(input, activeTripId),
    [input, activeTripId],
  );
  const isIncomeInput = /^income(?:\s|$)/i.test(input.trim());
  const currentTripIncomes = incomes.filter(
    (income) => String(income.tripId) === String(activeTripId),
  );
  const currentTripExpenses = expenses.filter(
    (expense) => expense.tripId === activeTripId,
  );
  const today = currentTripExpenses.filter(
    (expense) => expense.date === "Today",
  );
  const totals = currentTripExpenses.reduce(
    (summary, expense) => ({
      gross: summary.gross + expense.amountCents,
      personal: summary.personal + expense.myCostCents,
      owed: summary.owed + expense.owedCents,
    }),
    { gross: 0, personal: 0, owed: 0 },
  );

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUserEmail(data.session?.user.email ?? null);
      setAuthReady(true);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserEmail(session?.user.email ?? null);
        setAuthReady(true);
      },
    );
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function loadSupabaseData() {
      if (!userEmail) return;
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      const [
        { data: remoteTrips, error: tripsError },
        { data: remoteExpenses, error: expensesError },
        { data: remoteIncomes, error: incomesError },
      ] = await Promise.all([
        supabase
          .from("trips")
          .select("id, name, description, share_token, route, start_date, end_date, budget_minor")
          .order("created_at", { ascending: false }),
        supabase
          .from("expenses")
          .select(
            "id, trip_id, title, note, raw_input, amount_minor, base_amount_minor, category_id, categories(name), split_status, spent_at, expense_participants(share_minor, user_id, is_excluded)",
          )
          .order("spent_at", { ascending: false }),
        supabase
          .from("incomes")
          .select("id, trip_id, source, amount_minor, received_at")
          .order("received_at", { ascending: false }),
      ]);
      if (tripsError || expensesError || !remoteTrips || !remoteExpenses)
        return;
      if (incomesError) {
        setIncomeError(
          "Trip income could not be loaded. Apply supabase/income-migration.sql to enable income tracking.",
        );
      } else {
        setIncomeError("");
      }
      const remoteTripRows: Trip[] = remoteTrips.map((trip) => ({
        id: trip.id,
        name: trip.name,
        description: trip.description || undefined,
        shareToken: trip.share_token || undefined,
        route: trip.route || trip.name,
        dates:
          [trip.start_date, trip.end_date].filter(Boolean).join(" – ") ||
          "New trip",
        budgetCents: Number(trip.budget_minor || 0),
      }));
      const remoteExpenseRows: Expense[] = remoteExpenses.map((expense) => {
        const participant = expense.expense_participants?.find(
          (item) => item.user_id === authData.user.id,
        );
        const amountCents = Number(
          expense.base_amount_minor ?? expense.amount_minor,
        );
        const myCostCents = Number(
          participant?.is_excluded
            ? 0
            : (participant?.share_minor ?? amountCents),
        );
          const peopleMatch = expense.raw_input?.match(/\/(\d+)/);
          const people = peopleMatch ? Number(peopleMatch[1]) : undefined;
        const title = expense.title || "Expense";
        const detectedCategory = detectExpenseCategory(title);
        const storedCategory = expense.categories?.[0]?.name;
        const category = expenseCategoryNames.includes(
          storedCategory as (typeof expenseCategoryNames)[number],
        )
          ? (storedCategory as (typeof expenseCategoryNames)[number])
          : detectedCategory.category;
        const { icon } = getExpenseCategoryInfo(category);
        const spentAt = new Date(expense.spent_at);
        return {
          id: expense.id,
          tripId: expense.trip_id,
          title,
          note: expense.note || undefined,
          amountCents,
          myCostCents,
          owedCents: Math.max(0, amountCents - myCostCents),
          category,
          icon,
          people,
          isExcluded: Boolean(participant?.is_excluded),
          time: spentAt.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
          spentAt: expense.spent_at,
          date:
            spentAt.toDateString() === new Date().toDateString()
              ? "Today"
              : spentAt.toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                }),
          splitStatus: expense.split_status,
        };
      });
      setTrips(remoteTripRows);
      setExpenses(remoteExpenseRows);
      setIncomes(
        (remoteIncomes || []).map((income) => ({
          id: income.id,
          tripId: income.trip_id,
          source: income.source,
          amountCents: Number(income.amount_minor),
          receivedAt: income.received_at,
        })),
      );
      setActiveTripId(remoteTripRows[0]?.id ?? "");
      if (!remoteTripRows.length) setActiveTab("Trip");
      setDataSource("supabase");
    }
    void loadSupabaseData();
  }, [userEmail]);

  async function addParsedExpense(expense: Expense, rawInput: string) {
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user && typeof activeTripId === "string") {
      const { data: categoryRow, error: categoryError } = await supabase
        .from("categories")
        .upsert(
          { owner_id: authData.user.id, name: expense.category },
          { onConflict: "owner_id,name" },
        )
        .select("id")
        .single();
      if (categoryError || !categoryRow) return false;
      const { data: inserted, error } = await supabase
        .from("expenses")
        .insert({
          trip_id: activeTripId,
          category_id: categoryRow.id,
          title: expense.title,
          note: expense.note || null,
          raw_input: rawInput,
          amount_minor: expense.amountCents,
          base_amount_minor: expense.amountCents,
          paid_by: authData.user.id,
          split_status: expense.splitStatus,
          spent_at: expense.spentAt,
        })
        .select("id")
        .single();
      if (error || !inserted) return false;
      const { error: participantError } = await supabase
        .from("expense_participants")
        .insert({
          expense_id: inserted.id,
          user_id: authData.user.id,
          share_minor: expense.myCostCents,
          amount_owed_minor: expense.owedCents,
          is_excluded: expense.myCostCents === 0,
        });
      if (participantError) return false;
      setExpenses((current) => [{ ...expense, id: inserted.id }, ...current]);
    } else {
      setExpenses((current) => [expense, ...current]);
    }
    return true;
  }

  async function addParsedIncome(income: Income) {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user || typeof income.tripId !== "string") {
      setEntryError("Sign in and select a saved trip before adding income.");
      return false;
    }
    const { data: inserted, error } = await supabase
      .from("incomes")
      .insert({
        trip_id: income.tripId,
        received_by: authData.user.id,
        source: income.source,
        amount_minor: income.amountCents,
        received_at: income.receivedAt,
      })
      .select("id")
      .single();
    if (error || !inserted) {
      setEntryError(
        "Could not save income. Check the connection and apply supabase/income-migration.sql if income storage is not installed.",
      );
      return false;
    }
    setIncomes((current) => [{ ...income, id: inserted.id }, ...current]);
    setEntryError("");
    return true;
  }

  async function addExpense() {
    if (!preview || !activeTripId) return;
    if (await addParsedExpense(preview, input)) setInput("");
  }

  async function addQuickEntry() {
    if (isIncomeInput) {
      if (!incomePreview) {
        setEntryError("Use income followed by a positive amount, for example: income 4000 gift from Mom.");
        return;
      }
      if (await addParsedIncome(incomePreview)) setInput("");
      return;
    }
    await addExpense();
  }

  async function addImportedExpenses(notes: string) {
    if (!activeTripId) return { imported: 0, incomeImported: 0, skipped: 0 };
    let importDate = { label: "Today", iso: new Date().toISOString() };
    let imported = 0;
    let incomeImported = 0;
    let skipped = 0;
    const lines = notes
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    for (const line of lines) {
      const dateHeading = parseDateHeading(line);
      if (dateHeading) {
        importDate = dateHeading;
        continue;
      }
      if (/^income(?:\s|$)/i.test(line)) {
        const income = parseIncome(line, activeTripId, importDate.iso);
        if (!income) {
          skipped += 1;
          continue;
        }
        if (await addParsedIncome(income)) incomeImported += 1;
        else skipped += 1;
        continue;
      }
      const expense = parseExpense(
        line,
        activeTripId,
        importDate.label,
        importDate.iso,
      );
      if (!expense) {
        skipped += 1;
        continue;
      }
      if (await addParsedExpense(expense, line)) imported += 1;
      else skipped += 1;
    }
    return { imported, incomeImported, skipped };
  }

  function editIncome(income: Income) {
    setEditingIncome(income);
    setEditIncomeSource(income.source);
    setEditIncomeAmount(String(income.amountCents / 100));
    setEntryError("");
  }

  async function saveIncomeEdit() {
    if (!editingIncome || !editIncomeSource.trim()) return;
    const amountCents = Math.round(Number(editIncomeAmount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setEntryError("Enter an income amount greater than zero.");
      return;
    }
    if (typeof editingIncome.id === "string") {
      const { error } = await supabase
        .from("incomes")
        .update({ source: editIncomeSource.trim(), amount_minor: amountCents })
        .eq("id", editingIncome.id);
      if (error) {
        setEntryError("Could not update this income entry. Please try again.");
        return;
      }
    }
    setIncomes((current) =>
      current.map((income) =>
        income.id === editingIncome.id
          ? { ...income, source: editIncomeSource.trim(), amountCents }
          : income,
      ),
    );
    setEditingIncome(null);
    setEntryError("");
  }

  async function deleteIncome(income: Income) {
    if (typeof income.id === "string") {
      const { error } = await supabase.from("incomes").delete().eq("id", income.id);
      if (error) {
        setIncomeError("Could not delete this income entry. Please try again.");
        return;
      }
    }
    setIncomes((current) => current.filter((item) => item.id !== income.id));
    setIncomeError("");
  }

  async function updateExpense(expense: Expense) {
    setEditingExpense(expense);
    setEditExpenseTitle(expense.title);
    setEditExpenseNote(expense.note || "");
    setEditExpenseAmount(String(expense.amountCents / 100));
    setEditExpensePeople(String(expense.people ?? 1));
    setEditExpenseExcluded(Boolean(expense.isExcluded));
    setEditExpenseCategory(expense.category);
  }

  async function saveExpenseEdit() {
    if (!editingExpense || !editExpenseTitle.trim()) return;
    const amountCents = Math.round(Number(editExpenseAmount) * 100);
    const people = Math.floor(Number(editExpensePeople));
    if (
      !Number.isFinite(amountCents) ||
      amountCents < 0 ||
      !Number.isFinite(people) ||
      people < 1
    )
      return;
    const myCostCents = editExpenseExcluded
      ? 0
      : Math.floor(amountCents / people);
    const owedCents = Math.max(0, amountCents - myCostCents);
    const category = expenseCategoryNames.includes(
      editExpenseCategory as (typeof expenseCategoryNames)[number],
    )
      ? (editExpenseCategory as (typeof expenseCategoryNames)[number])
      : "Other";
    const { icon } = getExpenseCategoryInfo(category);
    if (typeof editingExpense.id === "string") {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      const { data: categoryRow, error: categoryError } = await supabase
        .from("categories")
        .upsert(
          { owner_id: authData.user.id, name: category },
          { onConflict: "owner_id,name" },
        )
        .select("id")
        .single();
      if (categoryError || !categoryRow) return;
      const { error } = await supabase
        .from("expenses")
        .update({
          category_id: categoryRow.id,
          title: editExpenseTitle.trim(),
          note: editExpenseNote.trim() || null,
          amount_minor: amountCents,
          base_amount_minor: amountCents,
          raw_input: `${editExpenseTitle.trim()} ${amountCents / 100}${people > 1 ? ` /${people}` : ""}${editExpenseExcluded ? " -me" : ""}`,
        })
        .eq("id", editingExpense.id);
      if (error) return;
      const { error: participantError } = await supabase
        .from("expense_participants")
        .update({
          share_minor: myCostCents,
          amount_owed_minor: owedCents,
          is_excluded: editExpenseExcluded,
        })
        .eq("expense_id", editingExpense.id)
        .eq("user_id", authData.user.id);
      if (participantError) return;
    }
    setExpenses((current) =>
      current.map((item) =>
        item.id === editingExpense.id
          ? {
              ...item,
              title: editExpenseTitle.trim(),
              category,
              icon,
              amountCents,
              myCostCents,
              owedCents,
              people: people > 1 ? people : undefined,
              isExcluded: editExpenseExcluded,
              note: editExpenseNote.trim() || undefined,
            }
          : item,
      ),
    );
    setEditingExpense(null);
  }

  async function deleteExpense(expense: Expense) {
    setEditingExpense(null);
    if (typeof expense.id === "string") {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expense.id);
      if (error) return;
    }
    setExpenses((current) => current.filter((item) => item.id !== expense.id));
  }

  async function updateExpenseStatus(expense: Expense, status: ExpenseStatus) {
    if (typeof expense.id === "string") {
      const { error } = await supabase
        .from("expenses")
        .update({ split_status: status })
        .eq("id", expense.id);
      if (error) return;
    }
    setExpenses((current) =>
      current.map((item) =>
        item.id === expense.id ? { ...item, splitStatus: status } : item,
      ),
    );
  }

  if (!authReady) return <AuthLoading />;
  if (!userEmail) return <AuthScreen />;

  return (
    <main className="app-shell">
      <div className="app-content">
        <header className="topbar">
          <div className="app-brand">
            <img className="brand-logo" src="/icon.svg" alt="FinTrack" />
            <div>
            <p className="eyebrow">
              {dataSource === "supabase" ? "SYNCED TRIP" : "YOUR TRIP"}
            </p>
            <h1>{activeTab === "Today" ? "Travel expenses" : activeTab}</h1>
            </div>
          </div>
          <button
            className="avatar"
            aria-label="Sign out"
            onClick={() => void supabase.auth.signOut()}
          >
            {userEmail.slice(0, 2).toUpperCase()}
          </button>
        </header>
        {!isOnline && <div className="offline-banner">Offline mode · your capture draft is saved on this device.</div>}
        {activeTab === "Today" && (
          <>
            <section className="capture-section">
              <div className="capture-heading">
                <span className="live-dot" />
                <span>Quick capture</span>
              </div>
              <div className={`capture-box ${input ? "is-active" : ""}`}>
                <Plus size={23} />
                <input
                  value={input}
                  onChange={(event) => {
                    setInput(event.target.value);
                    setEntryError("");
                  }}
                  onKeyDown={(event) => event.key === "Enter" && void addQuickEntry()}
                  placeholder="Expense or income received?"
                  autoComplete="off"
                />
                {input && (
                  <button
                    className="clear-button"
                    onClick={() => setInput("")}
                    aria-label="Clear input"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>
              <p className="input-hint">
                Try{" "}
                <button onClick={() => setInput("307.32 train /3")}>
                  307.32 train /3
                </button>{" "}
                or{" "}
                <button onClick={() => setInput("83 coke /5 -me")}>
                  83 coke /5 -me
                </button>
                {" "}or{" "}
                <button onClick={() => setInput("income 4000 gift from Mom")}>
                  income 4000 gift from Mom
                </button>
              </p>
              {entryError && <p className="auth-error">{entryError}</p>}
              {preview && (
                <div className="preview-card">
                  <div className="preview-main">
                    <div className="expense-icon">
                      <ExpenseIcon type={preview.icon} />
                    </div>
                    <div>
                      <strong>{preview.title}</strong>
                      <span>
                        {preview.category} · {preview.note || "Personal expense"}
                      </span>
                    </div>
                    <b>{money(preview.amountCents, currency)}</b>
                  </div>
                  <div className="preview-details">
                    <span>
                      Your cost <strong>{money(preview.myCostCents, currency)}</strong>
                    </span>
                    <span>
                      {preview.owedCents ? (
                        <>
                          Owed to you{" "}
                          <strong className="green">
                            {money(preview.owedCents, currency)}
                          </strong>
                        </>
                      ) : (
                        "No split"
                      )}
                    </span>
                    <button onClick={() => void addExpense()}>
                      <Check size={15} /> Add expense
                    </button>
                  </div>
                </div>
              )}
              {isIncomeInput && incomePreview && (
                <div className="preview-card income-preview">
                  <div className="preview-main">
                    <div className="expense-icon"><CircleDollarSign size={18} /></div>
                    <div>
                      <strong>{incomePreview.source}</strong>
                      <span>Income received · not part of expense splits</span>
                    </div>
                    <b>{money(incomePreview.amountCents, currency)}</b>
                  </div>
                  <div className="preview-details">
                    <span>Trip income</span>
                    <button onClick={() => void addQuickEntry()}>
                      <Check size={15} /> Add income
                    </button>
                  </div>
                </div>
              )}
              {isIncomeInput && !incomePreview && input.trim() && (
                <p className="auth-error">
                  Use income followed by a positive amount, for example: income 4000 gift from Mom.
                </p>
              )}
            </section>
            <section className="today-summary">
              <div>
                <span>My cost today</span>
                <strong>
                  {money(
                    today.reduce((sum, item) => sum + item.myCostCents, 0),
                    currency,
                  )}
                </strong>
              </div>
              <div>
                <span>Owed to me</span>
                <strong className="green">
                  {money(today.reduce((sum, item) => sum + item.owedCents, 0), currency)}
                </strong>
              </div>
              <button
                className="round-action"
                aria-label="View today's details"
              >
                <ArrowUpRight size={17} />
              </button>
            </section>
            <div className="section-heading">
              <h2>Today</h2>
              <span>{today.length} expenses</span>
            </div>
            <div className="expense-list">
              {today.map((expense) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  onEdit={updateExpense}
                  onDelete={deleteExpense}
                  currency={currency}
                />
              ))}
            </div>
            <div className="insight">
              <Sparkles size={17} />
              <p>
                <strong>Nice and light.</strong> Your shared costs are 28% lower
                than yesterday.
              </p>
              <ChevronRight size={17} />
            </div>
          </>
        )}
        {activeTab === "Trip" && (
          <TripView
            activeTripId={activeTripId}
            setActiveTripId={setActiveTripId}
            expenses={expenses}
            incomes={incomes}
            trips={trips}
            setTrips={setTrips}
            currency={currency}
            incomeError={incomeError}
            onEditIncome={editIncome}
            onDeleteIncome={(income) => void deleteIncome(income)}
          />
        )}
        {activeTab === "History" && (
          <HistoryView
            expenses={currentTripExpenses}
            incomes={currentTripIncomes}
            onEdit={updateExpense}
            onDelete={deleteExpense}
            onEditIncome={editIncome}
            onDeleteIncome={(income) => void deleteIncome(income)}
            currency={currency}
          />
        )}
        {activeTab === "Owed" && (
          <OwedView
            totals={totals}
            expenses={currentTripExpenses}
            onStatusChange={updateExpenseStatus}
            currency={currency}
          />
        )}
        {activeTab === "More" && (
          <MoreView
            expenses={currentTripExpenses}
            incomes={currentTripIncomes}
            trips={trips}
            activeTripId={activeTripId}
            setTrips={setTrips}
            profileName={profileName}
            currency={currency}
            onProfileNameChange={updateProfileName}
            onCurrencyChange={updateCurrency}
            onImportNotes={addImportedExpenses}
          />
        )}
      </div>
      {editingExpense && (
        <div className="editor-backdrop" role="presentation">
          <form
            className="editor-card"
            onSubmit={(event) => {
              event.preventDefault();
              void saveExpenseEdit();
            }}
          >
            <div className="editor-heading">
              <h2>Edit expense</h2>
              <button type="button" onClick={() => setEditingExpense(null)} aria-label="Close editor">
                <X size={18} />
              </button>
            </div>
            <label>Expense name<input value={editExpenseTitle} onChange={(event) => setEditExpenseTitle(event.target.value)} required /></label>
            <label>Note<textarea value={editExpenseNote} onChange={(event) => setEditExpenseNote(event.target.value)} placeholder="Add a note about this expense" rows={3} /></label>
            <label>Amount in THB<input type="number" min="0" step="0.01" value={editExpenseAmount} onChange={(event) => setEditExpenseAmount(event.target.value)} required /></label>
            <label>Divided by<input type="number" min="1" step="1" value={editExpensePeople} onChange={(event) => setEditExpensePeople(event.target.value)} required /></label>
                        <label>Category<select value={editExpenseCategory} onChange={(event) => setEditExpenseCategory(event.target.value)}>
                          {expenseCategoryNames.map((category) => <option key={category} value={category}>{category}</option>)}
                        </select></label>
            <label className="editor-checkbox"><input type="checkbox" checked={!editExpenseExcluded} onChange={(event) => setEditExpenseExcluded(!event.target.checked)} /> I am included in the split</label>
            <button className="auth-submit" type="submit">Save changes</button>
          </form>
        </div>
      )}
      {editingIncome && (
        <div className="editor-backdrop" role="presentation">
          <form
            className="editor-card"
            onSubmit={(event) => {
              event.preventDefault();
              void saveIncomeEdit();
            }}
          >
            <div className="editor-heading">
              <h2>Edit income</h2>
              <button type="button" onClick={() => setEditingIncome(null)} aria-label="Close editor">
                <X size={18} />
              </button>
            </div>
            <label>Source<input value={editIncomeSource} onChange={(event) => setEditIncomeSource(event.target.value)} required /></label>
            <label>Amount in THB<input type="number" min="0.01" step="0.01" value={editIncomeAmount} onChange={(event) => setEditIncomeAmount(event.target.value)} required /></label>
            {entryError && <p className="auth-error">{entryError}</p>}
            <button className="auth-submit" type="submit">Save changes</button>
          </form>
        </div>
      )}
      <nav className="bottom-nav">
        {[
          ["Today", Compass],
          ["Trip", BarChart3],
          ["History", History],
          ["Owed", CircleDollarSign],
          ["More", MoreHorizontal],
        ].map(([label, Icon]) => (
          <button
            key={label as string}
            className={activeTab === label ? "active" : ""}
            onClick={() => setActiveTab(label as string)}
          >
            <Icon size={20} strokeWidth={activeTab === label ? 2.3 : 1.7} />
            <span>{label as string}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}

function AuthLoading() {
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <img className="auth-logo" src="/icon.svg" alt="FinTrack" />
        <p className="eyebrow">FINTRACK</p>
        <h1>Travel expenses</h1>
        <p className="auth-copy">กำลังตรวจสอบบัญชีของคุณ...</p>
      </div>
    </main>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");
    const result =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    if (result.error) setError(result.error.message);
    else if (mode === "sign-up")
      setMessage("สร้างบัญชีแล้ว โปรดตรวจอีเมลเพื่อยืนยันก่อนเข้าสู่ระบบ");
    setPending(false);
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <img className="auth-mark" src="/icon.svg" alt="FinTrack" />
          <div>
            <p className="eyebrow">FINTRACK</p>
            <h1>Travel expenses</h1>
          </div>
        </div>
        <p className="auth-copy">
          เก็บค่าใช้จ่ายระหว่างทริปให้เป็นระเบียบ และเปิดดูได้จากทุกอุปกรณ์
        </p>
        <div className="auth-tabs">
          <button
            className={mode === "sign-in" ? "active" : ""}
            onClick={() => setMode("sign-in")}
          >
            เข้าสู่ระบบ
          </button>
          <button
            className={mode === "sign-up" ? "active" : ""}
            onClick={() => setMode("sign-up")}
          >
            สร้างบัญชี
          </button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <label>
            อีเมล
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            รหัสผ่าน
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={
                mode === "sign-in" ? "current-password" : "new-password"
              }
              minLength={6}
              required
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-message">{message}</p>}
          <button className="auth-submit" disabled={pending}>
            {pending
              ? "กำลังดำเนินการ..."
              : mode === "sign-in"
                ? "เข้าสู่ระบบ"
                : "สร้างบัญชี"}
          </button>
        </form>
        <p className="auth-note">
          บัญชีของคุณจะถูกเก็บใน Supabase Auth อย่างปลอดภัย
        </p>
      </div>
    </main>
  );
}

function ExpenseRow({
  expense,
  onEdit,
  onDelete,
  currency,
}: {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  currency: AppCurrency;
}) {
  return (
    <article className="expense-row" onClick={() => onEdit(expense)}>
      <div className="expense-icon">
        <ExpenseIcon type={expense.icon} />
      </div>
      <div className="expense-copy">
        <strong>{expense.title}</strong>
        <span>
          {expense.note || expense.category} · {expense.time}
        </span>
      </div>
      <div className="expense-values">
        <span className="value-label">Paid</span>
        <strong>{money(expense.amountCents, currency)}</strong>
        {expense.owedCents > 0 ? (
          <>
            <span className="value-label green">Owed back</span>
            <strong className="green">{money(expense.owedCents, currency)}</strong>
          </>
        ) : (
          <>
            <span className="value-label">Your cost</span>
            <strong>{money(expense.myCostCents, currency)}</strong>
          </>
        )}
      </div>
      <div className="row-actions">
        <button
          onClick={(event) => {
            event.stopPropagation();
            onEdit(expense);
          }}
          aria-label={`Edit ${expense.title}`}
        >
          Edit
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onDelete(expense);
          }}
          aria-label={`Delete ${expense.title}`}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function IncomeRow({
  income,
  currency,
  onEdit,
  onDelete,
}: {
  income: Income;
  currency: AppCurrency;
  onEdit: (income: Income) => void;
  onDelete: (income: Income) => void;
}) {
  return (
    <article className="income-row">
      <div className="expense-icon income-icon"><CircleDollarSign size={18} /></div>
      <div className="expense-copy">
        <strong>{income.source}</strong>
        <span>Income received · {new Date(income.receivedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
      </div>
      <strong className="income-amount">+{money(income.amountCents, currency)}</strong>
      <div className="row-actions">
        <button onClick={() => onEdit(income)} aria-label={`Edit income from ${income.source}`}>
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(income)} aria-label={`Delete income from ${income.source}`}>
          <Trash2 size={14} />
        </button>
      </div>
    </article>
  );
}

function TripView({
  activeTripId,
  setActiveTripId,
  expenses,
  incomes,
  trips,
  setTrips,
  currency,
  incomeError,
  onEditIncome,
  onDeleteIncome,
}: {
  activeTripId: string | number;
  setActiveTripId: (id: string | number) => void;
  expenses: Expense[];
  incomes: Income[];
  trips: Trip[];
  setTrips: (trips: Trip[]) => void;
  currency: AppCurrency;
  incomeError: string;
  onEditIncome: (income: Income) => void;
  onDeleteIncome: (income: Income) => void;
}) {
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [editingTrip, setEditingTrip] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [newTripName, setNewTripName] = useState("");
  const [newTripDescription, setNewTripDescription] = useState("");
  const [tripBudget, setTripBudget] = useState("");
  const activeTrip = trips.find(
    (trip) => String(trip.id) === String(activeTripId),
  ) ||
    trips[0] || { id: "", name: "", route: "", dates: "" };
  const visibleExpenses = expenses.filter(
    (expense) => String(expense.tripId) === String(activeTrip.id),
  );
  const visibleIncomes = incomes.filter(
    (income) => String(income.tripId) === String(activeTrip.id),
  );
  const totalIncome = visibleIncomes.reduce(
    (sum, income) => sum + income.amountCents,
    0,
  );
  const tripTotals = visibleExpenses.reduce(
    (summary, expense) => ({
      gross: summary.gross + expense.amountCents,
      personal: summary.personal + expense.myCostCents,
      owed: summary.owed + expense.owedCents,
    }),
    { gross: 0, personal: 0, owed: 0 },
  );
  const categoryTotals = visibleExpenses.reduce<Record<string, number>>(
    (summary, expense) => {
      summary[expense.category] =
        (summary[expense.category] || 0) + expense.myCostCents;
      return summary;
    },
    {},
  );
  const categoryColors = [
    "var(--coral)",
    "var(--blue)",
    "var(--yellow)",
    "var(--lavender)",
    "var(--green)",
  ];
  const categories = Object.entries(categoryTotals)
    .sort(([, first], [, second]) => second - first)
    .map(([name, value], index) => ({
      name,
      value,
      percentage: tripTotals.personal
        ? Math.round((value / tripTotals.personal) * 100)
        : 0,
      color: categoryColors[index % categoryColors.length],
    }));
  const dailyTotals = Object.entries(
    visibleExpenses.reduce<Record<string, number>>((summary, expense) => {
      const key = expense.date || "Unknown";
      summary[key] = (summary[key] || 0) + expense.myCostCents;
      return summary;
    }, {}),
  )
    .sort(([, first], [, second]) => second - first)
    .slice(0, 7)
    .reverse();
  const dailyPeak = Math.max(...dailyTotals.map(([, value]) => value), 1);
  const budgetRatio = activeTrip.budgetCents ? tripTotals.personal / activeTrip.budgetCents : 0;
  async function enableBudgetAlerts() {
    if (!("Notification" in window)) {
      setNotificationMessage("Browser notifications are not supported here.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setNotificationMessage("Notifications remain off until you allow them in your browser.");
      return;
    }
    if (budgetRatio >= 1) {
      new Notification("FinTrack budget alert", { body: `${activeTrip.name} is over budget.` });
      setNotificationMessage("Budget alert sent.");
    } else if (budgetRatio >= 0.8) {
      new Notification("FinTrack budget alert", { body: `${activeTrip.name} is ${Math.round(budgetRatio * 100)}% used.` });
      setNotificationMessage("Budget alert sent.");
    } else {
      setNotificationMessage("Budget alerts enabled. You are below the 80% threshold.");
    }
  }
  async function createTrip() {
    const name = newTripName.trim();
    if (!name) return;
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return;
    const { data: inserted, error } = await supabase
      .from("trips")
      .insert({ owner_id: authData.user.id, name, description: newTripDescription.trim() || null, route: name, budget_minor: Math.round(Number(tripBudget || 0) * 100) })
      .select("id, name, description, share_token, route, start_date, end_date, budget_minor")
      .single();
    if (error || !inserted) return;
    const trip = {
      id: inserted.id,
      name: inserted.name,
      description: inserted.description || undefined,
      shareToken: inserted.share_token || undefined,
      route: inserted.route || inserted.name,
      dates:
        [inserted.start_date, inserted.end_date].filter(Boolean).join(" – ") ||
        "New trip",
      budgetCents: Number(inserted.budget_minor || 0),
    };
    setTrips([...trips, trip]);
    setActiveTripId(trip.id);
    setNewTripName("");
    setNewTripDescription("");
    setTripBudget("");
    setShowNewTrip(false);
  }
  function editTrip() {
    if (!activeTrip.id) return;
    setNewTripName(activeTrip.name);
    setNewTripDescription(activeTrip.description || "");
    setTripBudget(activeTrip.budgetCents ? String(activeTrip.budgetCents / 100) : "");
    setEditingTrip(true);
    setShowNewTrip(false);
  }
  async function saveTripEdit() {
    const name = newTripName.trim();
    if (!name || !activeTrip.id) return;
    if (typeof activeTrip.id === "string") {
      const { error } = await supabase
        .from("trips")
        .update({ name, description: newTripDescription.trim() || null, route: name, budget_minor: Math.round(Number(tripBudget || 0) * 100) })
        .eq("id", activeTrip.id);
      if (error) return;
    }
    setTrips(
      trips.map((trip) =>
        trip.id === activeTrip.id
          ? { ...trip, name, description: newTripDescription.trim() || undefined, route: name, budgetCents: Math.round(Number(tripBudget || 0) * 100) }
          : trip,
      ),
    );
    setEditingTrip(false);
    setNewTripName("");
    setNewTripDescription("");
    setTripBudget("");
  }
  async function deleteTrip() {
    if (!activeTrip.id) return;
    if (typeof activeTrip.id === "string") {
      const { error } = await supabase
        .from("trips")
        .delete()
        .eq("id", activeTrip.id);
      if (error) return;
    }
    setTrips(trips.filter((trip) => trip.id !== activeTrip.id));
    setActiveTripId("");
  }
  if (!trips.length)
    return (
      <section className="empty-trip">
        <MapPin size={24} />
        <h2>สร้างทริปแรกของคุณ</h2>
        <p>เริ่มจากตั้งชื่อทริป แล้วค่อยเพิ่มค่าใช้จ่ายเข้าไป</p>
        <div className="new-trip-form">
          <input
            value={newTripName}
            onChange={(event) => setNewTripName(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && void createTrip()}
            placeholder="เช่น Seoul food trip"
            autoFocus
          />
          <textarea
            value={newTripDescription}
            onChange={(event) => setNewTripDescription(event.target.value)}
            placeholder="Short description (optional)"
            rows={2}
          />
          <input type="number" min="0" step="0.01" value={tripBudget} onChange={(event) => setTripBudget(event.target.value)} placeholder="Budget (optional)" />
          <button onClick={() => void createTrip()}>Create trip</button>
        </div>
      </section>
    );
  return (
    <>
      <div className="trip-toolbar">
        <label htmlFor="trip-select">Trip</label>
        <select
          id="trip-select"
          value={String(activeTrip.id)}
          onChange={(event) => setActiveTripId(event.target.value)}
        >
          {trips.map((trip) => (
            <option value={trip.id} key={trip.id}>
              {trip.name}
            </option>
          ))}
        </select>
        <button
          className="new-trip-button"
          onClick={() => setShowNewTrip((current) => !current)}
        >
          <Plus size={16} /> New
        </button>
        <button className="trip-action-button" onClick={() => void editTrip()}>
          Edit
        </button>
        <button
          className="trip-action-button danger"
          onClick={() => void deleteTrip()}
        >
          Delete
        </button>
      </div>
      {showNewTrip && (
        <div className="new-trip-form">
          <input
            value={newTripName}
            onChange={(event) => setNewTripName(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && createTrip()}
            placeholder="Trip name, e.g. Seoul food trip"
            autoFocus
          />
          <textarea
            value={newTripDescription}
            onChange={(event) => setNewTripDescription(event.target.value)}
            placeholder="Short description (optional)"
            rows={2}
          />
          <input type="number" min="0" step="0.01" value={tripBudget} onChange={(event) => setTripBudget(event.target.value)} placeholder="Budget (optional)" />
          <button onClick={createTrip}>Create</button>
        </div>
      )}
      {editingTrip && (
        <div className="new-trip-form">
          <input value={newTripName} onChange={(event) => setNewTripName(event.target.value)} autoFocus />
          <textarea value={newTripDescription} onChange={(event) => setNewTripDescription(event.target.value)} placeholder="Short description (optional)" rows={2} />
          <input type="number" min="0" step="0.01" value={tripBudget} onChange={(event) => setTripBudget(event.target.value)} placeholder="Budget (optional)" />
          <button onClick={() => void saveTripEdit()}>Save</button>
          <button className="trip-action-button" onClick={() => setEditingTrip(false)}>Cancel</button>
        </div>
      )}
      <div className="trip-hero">
        <div>
          <p className="eyebrow">CURRENT TRIP · 7 DAYS</p>
          <h2>{activeTrip.route}</h2>
          <p className="muted">{activeTrip.dates}</p>
          {activeTrip.description && <p className="muted">{activeTrip.description}</p>}
        </div>
        <div className="trip-mark">
          <MapPin size={20} />
        </div>
      </div>
      <section className="trip-financial-summary" aria-label="Trip totals">
        <div>
          <span>Total income</span>
          <strong className="green">{money(totalIncome, currency)}</strong>
        </div>
        <div>
          <span>Total expenses</span>
          <strong>{money(tripTotals.gross, currency)}</strong>
        </div>
      </section>
      <section className="big-stat">
        <span>Actual personal cost</span>
        <strong>{money(tripTotals.personal, currency)}</strong>
        <p>
          <span className="green">{money(tripTotals.owed, currency)}</span> is owed back
          to you
        </p>
      </section>
      <section className="budget-panel">
        <div className="section-heading">
          <h2>Trip budget</h2>
          <span>{activeTrip.budgetCents ? `${Math.round((tripTotals.personal / activeTrip.budgetCents) * 100)}% used` : "Not set"}</span>
        </div>
        <div className="budget-track"><i style={{ width: `${activeTrip.budgetCents ? Math.min(100, (tripTotals.personal / activeTrip.budgetCents) * 100) : 0}%` }} /></div>
        <div className="budget-meta">
          <span>{money(tripTotals.personal, currency)} spent</span>
          <strong>{activeTrip.budgetCents ? `${money(Math.max(0, activeTrip.budgetCents - tripTotals.personal), currency)} left` : "Set a budget in Edit"}</strong>
        </div>
        {(activeTrip.budgetCents ?? 0) > 0 && <button className="budget-alert-button" onClick={() => void enableBudgetAlerts()}><Sparkles size={14} /> Enable budget alerts</button>}
        {notificationMessage && <p className="budget-notice">{notificationMessage}</p>}
      </section>
      <div className="metric-grid">
        <div>
          <span>Gross paid</span>
          <strong>{money(tripTotals.gross, currency)}</strong>
        </div>
        <div>
          <span>Daily average</span>
          <strong>{money(Math.round(tripTotals.personal / 7), currency)}</strong>
        </div>
        <div>
          <span>Shared</span>
          <strong>
            {visibleExpenses.filter((item) => item.people).length}
          </strong>
        </div>
        <div>
          <span>Expenses</span>
          <strong>{visibleExpenses.length}</strong>
        </div>
      </div>
      <section className="income-section">
        <div className="section-heading">
          <h2>Income received</h2>
          <span>{visibleIncomes.length} entries</span>
        </div>
        {incomeError && <p className="auth-error">{incomeError}</p>}
        {visibleIncomes.length ? (
          <div className="income-list">
            {visibleIncomes.map((income) => (
              <IncomeRow
                key={income.id}
                income={income}
                currency={currency}
                onEdit={onEditIncome}
                onDelete={onDeleteIncome}
              />
            ))}
          </div>
        ) : (
          <p className="empty-state">Use quick capture with “income 4000 gift from Mom” to add trip income.</p>
        )}
        <p className="income-note">Income is tracked separately and does not change shared expense splits.</p>
      </section>
      <section className="spending-chart">
        <div className="section-heading">
          <h2>Spending rhythm</h2>
          <span>Personal cost</span>
        </div>
        {dailyTotals.length ? (
          <div className="chart-bars" aria-label="Spending by day">
            {dailyTotals.map(([label, value]) => (
              <div className="chart-bar" key={label}>
                <div className="chart-bar-track"><i style={{ height: `${(value / dailyPeak) * 100}%` }} /></div>
                <strong>{money(value, currency)}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        ) : <p className="empty-state">Add expenses to see your spending rhythm.</p>}
      </section>
      <div className="section-heading">
        <h2>By category</h2>
        <span>Actual cost</span>
      </div>
      <div className="category-list">
        {categories.length ? (
          categories.map((category) => (
            <div className="category-row" key={category.name}>
              <span
                className="category-dot"
                style={{ background: category.color }}
              />
              <span>{category.name}</span>
              <div className="category-bar">
                <i
                  style={{
                    width: `${category.percentage}%`,
                    background: category.color,
                  }}
                />
              </div>
              <strong>{category.percentage}%</strong>
            </div>
          ))
        ) : (
          <p className="empty-state">No expenses in this trip yet.</p>
        )}
      </div>
      <div className="insight">
        <Sparkles size={17} />
        <p>
          <strong>
            {categories.length
              ? "Your trip is on track."
              : "Ready when you are."}
          </strong>{" "}
          {categories.length
            ? "Categories are calculated from this trip's actual cost."
            : "Add an expense to start the trip breakdown."}
        </p>
      </div>
    </>
  );
}

function OwedView({
  totals,
  expenses,
  onStatusChange,
  currency,
}: {
  totals: { gross: number; personal: number; owed: number };
  expenses: Expense[];
  onStatusChange: (expense: Expense, status: ExpenseStatus) => void;
  currency: AppCurrency;
}) {
  const [activeStatus, setActiveStatus] = useState<ExpenseStatus>("not_requested");
  const statusMeta: Record<
    ExpenseStatus,
    { label: string; hint: string; tone: string }
  > = {
    not_requested: {
      label: "ยังไม่ได้เรียกเก็บ",
      hint: "ยังไม่ได้ทวง",
      tone: "warm",
    },
    requesting: { label: "กำลังเรียกเก็บ", hint: "ส่งคำขอแล้ว", tone: "blue" },
    settled: { label: "ได้ครบแล้ว", hint: "ปิดรายการแล้ว", tone: "green" },
  };
  const statuses = (Object.keys(statusMeta) as ExpenseStatus[]).map((id) => {

    const matching = expenses.filter(
      (expense) => expense.splitStatus === id && expense.owedCents > 0,
    );
    return {
      id,
      ...statusMeta[id],
      amount: matching.reduce((sum, expense) => sum + expense.owedCents, 0),
      count: matching.length,
    };
  });
  const selected =
    statuses.find((status) => status.id === activeStatus) || statuses[0];
  const selectedExpenses = expenses.filter(
    (expense) => expense.splitStatus === selected.id && expense.owedCents > 0,
  );
  const nextStatus: Record<ExpenseStatus, ExpenseStatus> = {
    not_requested: "requesting",
    requesting: "settled",
    settled: "not_requested",
  };
  const nextStatusLabel: Record<ExpenseStatus, string> = {
    not_requested: "Mark requested",
    requesting: "Mark settled",
    settled: "Reopen",
  };
  return (
    <>
      <section className="owed-hero">
        <div className="balance-ring">
          <span>ยังต้องได้คืน</span>
          <strong>+{money(totals.owed, currency)}</strong>
          <small>จากค่าใช้จ่ายที่แชร์</small>
        </div>
      </section>
      <div className="section-heading">
        <h2>สถานะการตามเงิน</h2>
        <span>แตะเพื่อดู</span>
      </div>
      <div className="status-list">
        {statuses.map((status) => (
          <button
            key={status.id}
            type="button"
            className={`status-card ${status.tone} ${activeStatus === status.id ? "selected" : ""}`}
            onClick={() => setActiveStatus(status.id)}
          >
            <span className="status-check">
              {activeStatus === status.id ? <Check size={15} /> : null}
            </span>
            <span className="status-copy">
              <strong>{status.label}</strong>
              <small>
                {status.hint} · {status.count} รายการ
              </small>
            </span>
            <b>{money(status.amount, currency)}</b>
            <ChevronRight size={17} />
          </button>
        ))}
      </div>
      <div className="status-detail">
        <div>
          <span>สถานะที่เลือก</span>
          <strong>{selected.label}</strong>
        </div>
        <div>
          <span>ยอดรวม</span>
          <strong className={selected.amount > 0 ? "green" : ""}>
            {money(selected.amount, currency)}
          </strong>
        </div>
      </div>
      <div className="section-heading owed-expense-heading">
        <h2>รายการที่เกี่ยวข้อง</h2>
        <span>{selectedExpenses.length} รายการ</span>
      </div>
      <div className="owed-expense-list">
        {selectedExpenses.length ? (
          selectedExpenses.map((expense) => (
            <article className="owed-expense-row" key={expense.id}>
              <div className="expense-icon">
                <ExpenseIcon type={expense.icon} />
              </div>
              <div className="expense-copy">
                <strong>{expense.title}</strong>
                <span>{expense.note || expense.category} · {expense.date}</span>
              </div>
              <div className="expense-values">
                <span className="value-label green">Owed back</span>
                <strong className="green">{money(expense.owedCents, currency)}</strong>
                <button
                  className="owed-next-button"
                  type="button"
                  onClick={() => onStatusChange(expense, nextStatus[expense.splitStatus])}
                >
                  {nextStatusLabel[expense.splitStatus]}
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="empty-state">ไม่มี expense ในสถานะนี้</p>
        )}
      </div>
    </>
  );
}

function HistoryView({
  expenses,
  incomes,
  onEdit,
  onDelete,
  onEditIncome,
  onDeleteIncome,
  currency,
}: {
  expenses: Expense[];
  incomes: Income[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onEditIncome: (income: Income) => void;
  onDeleteIncome: (income: Income) => void;
  currency: AppCurrency;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "amount">("newest");
  const categories = ["All", ...new Set(expenses.map((expense) => expense.category))];
  const filteredExpenses = expenses
    .filter((expense) =>
      !query.trim() || expense.title.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .filter((expense) => category === "All" || expense.category === category)
    .sort((first, second) => {
      if (sortOrder === "amount") return second.amountCents - first.amountCents;
      const difference =
        new Date(second.spentAt || 0).getTime() - new Date(first.spentAt || 0).getTime();
      return sortOrder === "newest" ? difference : -difference;
    });
  const filteredIncomes = incomes
    .filter(
      (income) =>
        category === "All" &&
        (!query.trim() ||
          income.source.toLowerCase().includes(query.trim().toLowerCase())),
    )
    .sort((first, second) => {
      if (sortOrder === "amount") return second.amountCents - first.amountCents;
      const difference =
        new Date(second.receivedAt).getTime() -
        new Date(first.receivedAt).getTime();
      return sortOrder === "newest" ? difference : -difference;
    });
  const total = filteredExpenses.reduce((sum, expense) => sum + expense.amountCents, 0);
  const incomeTotal = filteredIncomes.reduce(
    (sum, income) => sum + income.amountCents,
    0,
  );
  const personal = filteredExpenses.reduce((sum, expense) => sum + expense.myCostCents, 0);
  type HistoryEntry =
    | { kind: "expense"; value: Expense; timestamp: number; date: string }
    | { kind: "income"; value: Income; timestamp: number; date: string };
  const entries: HistoryEntry[] = [
    ...filteredExpenses.map((expense) => ({
      kind: "expense" as const,
      value: expense,
      timestamp: new Date(expense.spentAt || 0).getTime(),
      date: expense.date || "Undated",
    })),
    ...filteredIncomes.map((income) => {
      const receivedAt = new Date(income.receivedAt);
      return {
        kind: "income" as const,
        value: income,
        timestamp: receivedAt.getTime(),
        date:
          receivedAt.toDateString() === new Date().toDateString()
            ? "Today"
            : receivedAt.toLocaleDateString([], { month: "short", day: "numeric" }),
      };
    }),
  ];
  const compareEntries = (first: HistoryEntry, second: HistoryEntry) => {
    if (sortOrder === "amount") {
      return second.value.amountCents - first.value.amountCents;
    }
    const difference = second.timestamp - first.timestamp;
    return sortOrder === "newest" ? difference : -difference;
  };
  const filteredGrouped = entries.sort(compareEntries).reduce<Record<string, HistoryEntry[]>>((groups, entry) => {
    (groups[entry.date] ||= []).push(entry);
    return groups;
  }, {});
  const orderedGroups = Object.entries(filteredGrouped)
    .map(([date, dateEntries]) => [
      date,
      dateEntries,
    ] as const)
    .sort(([, firstEntries], [, secondEntries]) => {
      if (sortOrder === "amount") return compareEntries(firstEntries[0], secondEntries[0]);
      const difference = secondEntries[0].timestamp - firstEntries[0].timestamp;
      return sortOrder === "newest" ? difference : -difference;
    });

  return (
    <>
      <section className="history-summary">
        <div><span>Total expenses</span><strong>{money(total, currency)}</strong></div>
        <div><span>Income received</span><strong className="green">{money(incomeTotal, currency)}</strong></div>
        <div><span>My cost</span><strong>{money(personal, currency)}</strong></div>
      </section>
      <div className="section-heading">
        <h2>Transaction history</h2>
        <span>{entries.length} entries · Current trip</span>
      </div>
      <div className="history-controls">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search transactions"
          aria-label="Search transactions"
        />
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category">
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)} aria-label="Sort transactions">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="amount">Highest amount</option>
        </select>
      </div>
      {orderedGroups.length ? orderedGroups.map(([date, dateEntries]) => (
        <section className="history-group" key={date}>
          <div className="history-date">
            <h3>{date}</h3>
            <span>{dateEntries.length} entries</span>
          </div>
          <div className="expense-list">
            {dateEntries.map((entry) => (
              entry.kind === "expense" ? (
                <ExpenseRow
                  key={`expense-${entry.value.id}`}
                  expense={entry.value}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  currency={currency}
                />
              ) : (
                <IncomeRow
                  key={`income-${entry.value.id}`}
                  income={entry.value}
                  currency={currency}
                  onEdit={onEditIncome}
                  onDelete={onDeleteIncome}
                />
              )
            ))}
          </div>
        </section>
      )) : <p className="empty-state">No transactions in this trip yet.</p>}
    </>
  );
}

function MoreView({
  expenses,
  incomes,
  trips,
  activeTripId,
  setTrips,
  profileName,
  currency,
  onProfileNameChange,
  onCurrencyChange,
  onImportNotes,
}: {
  expenses: Expense[];
  incomes: Income[];
  trips: Trip[];
  activeTripId: string | number;
  setTrips: (trips: Trip[]) => void;
  profileName: string;
  currency: AppCurrency;
  onProfileNameChange: (name: string) => void;
  onCurrencyChange: (currency: AppCurrency) => void;
  onImportNotes: (notes: string) =>
    | { imported: number; incomeImported: number; skipped: number }
    | Promise<{ imported: number; incomeImported: number; skipped: number }>;
}) {
  const [activeTool, setActiveTool] = useState<"import" | "currency" | null>(null);
  const [notes, setNotes] = useState("");
  const [nameDraft, setNameDraft] = useState(profileName);
  const [shareMessage, setShareMessage] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{
    type: "progress" | "success" | "error";
    message: string;
  } | null>(null);

  async function createShareLink() {
    const trip = trips.find((item) => String(item.id) === String(activeTripId));
    if (!trip || typeof trip.id !== "string") {
      setShareMessage("Save this trip to Supabase before sharing it.");
      return;
    }
    let shareToken = trip.shareToken;
    if (!shareToken) {
      shareToken = crypto.randomUUID().replace(/-/g, "");
      const { error } = await supabase
        .from("trips")
        .update({ share_token: shareToken })
        .eq("id", trip.id);
      if (error) {
        setShareMessage("Could not create a share link.");
        return;
      }
      setTrips(
        trips.map((item) =>
          item.id === trip.id ? { ...item, shareToken } : item,
        ),
      );
    }
    const link = `${window.location.origin}/share/${shareToken}`;
    await navigator.clipboard.writeText(link);
    setShareLink(link);
    setShareMessage("Read-only share link copied.");
  }

  function exportTripData() {
    const trip = trips[0];
    const payload = JSON.stringify({ trip, expenses, incomes }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${trip?.name || "trip"}-expenses.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const trip = trips.find((item) => String(item.id) === String(activeTripId)) || trips[0];
    const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const rows = [
      ["Trip", "Type", "Date", "Description", "Category", "Note", "Amount", "Your cost", "Owed back"],
      ...expenses.map((expense) => [
        trip?.name || "Trip",
        "Expense",
        expense.date,
        expense.title,
        expense.category,
        expense.note || "",
        money(expense.amountCents, currency),
        money(expense.myCostCents, currency),
        money(expense.owedCents, currency),
      ]),
      ...incomes.map((income) => [
        trip?.name || "Trip",
        "Income",
        new Date(income.receivedAt).toLocaleDateString(),
        income.source,
        "",
        "",
        money(income.amountCents, currency),
        "",
        "",
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.map(escapeCsv).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${trip?.name || "trip"}-expenses.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function printTrip() {
    window.print();
  }

  async function importNotes() {
    if (isImporting) return;
    if (!notes.trim()) {
      setImportFeedback({ type: "error", message: "Paste at least one entry to import." });
      return;
    }
    if (!activeTripId) {
      setImportFeedback({ type: "error", message: "Create or select a trip before importing entries." });
      return;
    }
    setIsImporting(true);
    setImportFeedback({ type: "progress", message: "Importing entries…" });
    try {
      const result = await onImportNotes(notes.trim());
      const importedCount = result.imported + result.incomeImported;
      if (!importedCount && !result.skipped) {
        setImportFeedback({ type: "error", message: "No entries were found to import." });
      } else {
        const importedSummary = `${result.imported} expense${result.imported === 1 ? "" : "s"} and ${result.incomeImported} income entr${result.incomeImported === 1 ? "y" : "ies"} imported`;
        setImportFeedback({
          type: result.skipped ? "error" : "success",
          message: `${importedSummary}${result.skipped ? `; ${result.skipped} entr${result.skipped === 1 ? "y was" : "ies were"} skipped.` : "."}`,
        });
      }
    } catch (error) {
      setImportFeedback({
        type: "error",
        message: error instanceof Error
          ? `Import failed: ${error.message}`
          : "Import failed. Please try again.",
      });
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <>
      <section className="more-intro">
        <div className="wallet-logo">
          <img src="/icon.svg" alt="FinTrack" />
        </div>
        <div>
          <p className="eyebrow">FINTRACK WALLET</p>
          <h2>{profileName}</h2>
          <p className="muted">{currency} · Asia/Bangkok</p>
        </div>
      </section>
      <div className="settings-list">
        <button type="button" onClick={() => setActiveTool(null)}>
          <CircleDollarSign size={19} />
          <span>Profile settings</span>
          <ChevronRight size={17} />
        </button>
        <button type="button" onClick={() => setActiveTool("import")}>
          <Receipt size={19} />
          <span>Import notes</span>
          <ChevronRight size={17} />
        </button>
        <button type="button" onClick={() => setActiveTool("currency")}>
          <CircleDollarSign size={19} />
          <span>Currencies</span>
          <ChevronRight size={17} />
        </button>
        <button type="button" onClick={() => void createShareLink()}>
          <Share2 size={19} />
          <span>Share read-only link</span>
          <ChevronRight size={17} />
        </button>
        <button type="button" onClick={exportTripData}>
          <WalletCards size={19} />
          <span>Export trip data</span>
          <ChevronRight size={17} />
        </button>
        <button type="button" onClick={exportCsv}>
          <Receipt size={19} />
          <span>Export CSV</span>
          <ChevronRight size={17} />
        </button>
        <button type="button" onClick={printTrip}>
          <Printer size={19} />
          <span>Print / save PDF</span>
          <ChevronRight size={17} />
        </button>
      </div>
      {shareMessage && <p className="share-message">{shareMessage}</p>}
      {shareLink && (
        <a className="share-link" href={shareLink} target="_blank" rel="noreferrer">
          {shareLink}
        </a>
      )}
      {!activeTool && (
        <div className="more-tool-panel">
          <strong>Profile settings</strong>
          <label>
            Display name
            <input
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              onBlur={() => onProfileNameChange(nameDraft)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onProfileNameChange(nameDraft);
              }}
              placeholder="Your name"
            />
          </label>
          <p>Your name and currency apply throughout the app.</p>
        </div>
      )}
      {activeTool === "import" && (
        <div className="more-tool-panel">
          <strong>Import notes</strong>
          <p>Paste one trip entry per line, such as “train 307.32 /3” or “income 4000 gift from Mom”.</p>
          <p className="import-format">
            Expenses use <code>AMOUNT DESCRIPTION</code>. Use <code>income AMOUNT SOURCE</code> for money received. Use <code>/3</code> for
            three people, <code>-me</code> when you do not pay your share, and a
            heading like <code>7 sept 2026</code> to set the date for following
            lines. The date stays active until the next heading.
          </p>
          <textarea
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              setImportFeedback(null);
            }}
            placeholder={'train 307.32 /3\nincome 4000 gift from Mom'}
            rows={6}
            disabled={isImporting}
          />
          <button
            className="auth-submit"
            type="button"
            onClick={() => void importNotes()}
            disabled={isImporting}
          >
            {isImporting ? "Importing entries…" : "Import entries"}
          </button>
          {importFeedback && (
            <p
              className={`import-feedback ${importFeedback.type}`}
              role={importFeedback.type === "error" ? "alert" : "status"}
              aria-live={importFeedback.type === "error" ? "assertive" : "polite"}
            >
              {importFeedback.message}
            </p>
          )}
        </div>
      )}
      {activeTool === "currency" && (
        <div className="more-tool-panel">
          <strong>Currency</strong>
          <label>
            App currency
            <select
              value={currency}
              onChange={(event) => onCurrencyChange(event.target.value as AppCurrency)}
            >
              <option value="THB">Thai Baht (THB)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="GBP">British Pound (GBP)</option>
              <option value="JPY">Japanese Yen (JPY)</option>
              <option value="KRW">South Korean Won (KRW)</option>
            </select>
          </label>
          <p>This display currency applies throughout the app.</p>
        </div>
      )}
      <div className="pro-card">
        <Sparkles size={19} />
        <div>
          <strong>Made for real trips</strong>
          <p>
            Quick capture is local-first. Supabase sync can plug in when
            you&apos;re ready.
          </p>
        </div>
      </div>
    </>
  );
}
