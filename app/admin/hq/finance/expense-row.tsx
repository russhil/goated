"use client";

import { useState, useTransition } from "react";
import { CURRENCIES, EXPENSE_CATEGORIES, inputClass } from "@/lib/hq";
import {
  createExpense,
  updateExpense,
  deleteExpense,
  type ExpenseInput,
} from "./actions";

export type Expense = {
  id: string;
  category: string;
  vendor: string | null;
  description: string | null;
  amount: number;
  currency: string;
  incurred_on: string;
  recurring: boolean;
  recurring_period: string | null;
};

export default function ExpenseRow({ expense }: { expense?: Expense }) {
  const isNew = !expense;
  const [category, setCategory] = useState(expense?.category ?? "misc");
  const [vendor, setVendor] = useState(expense?.vendor ?? "");
  const [description, setDescription] = useState(expense?.description ?? "");
  const [amount, setAmount] = useState(expense?.amount ?? 0);
  const [currency, setCurrency] = useState(expense?.currency ?? "INR");
  const [incurredOn, setIncurredOn] = useState(expense?.incurred_on ?? "");
  const [recurring, setRecurring] = useState(expense?.recurring ?? false);
  const [recurringPeriod, setRecurringPeriod] = useState(expense?.recurring_period ?? "monthly");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const build = (): ExpenseInput => ({
    category,
    vendor,
    description,
    amount: Number(amount) || 0,
    currency,
    incurred_on: incurredOn,
    recurring,
    recurring_period: recurringPeriod,
  });

  const save = () => {
    setError("");
    startTransition(async () => {
      const res = isNew
        ? await createExpense(build())
        : await updateExpense(expense!.id, build());
      if (!res.ok) setError(res.error || "save failed");
      else if (isNew) {
        setCategory("misc");
        setVendor("");
        setDescription("");
        setAmount(0);
        setCurrency("INR");
        setIncurredOn("");
        setRecurring(false);
        setRecurringPeriod("monthly");
      }
    });
  };

  const remove = () => {
    if (!expense) return;
    if (!window.confirm("Delete this expense?")) return;
    startTransition(async () => {
      const res = await deleteExpense(expense.id);
      if (!res.ok) setError(res.error || "delete failed");
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1.2fr_0.8fr_0.7fr_1fr_auto] gap-2 items-center">
      <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
        {EXPENSE_CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <input className={inputClass} value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="vendor" />
      <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="description" />
      <input type="number" className={inputClass} value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="amount" />
      <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <input type="date" className={inputClass} value={incurredOn} onChange={(e) => setIncurredOn(e.target.value)} />
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 font-mono text-[10px] text-muted">
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="accent-coral" />
          rec.
        </label>
        {recurring && (
          <select className={`${inputClass} max-w-[90px]`} value={recurringPeriod} onChange={(e) => setRecurringPeriod(e.target.value)}>
            <option value="monthly">monthly</option>
            <option value="yearly">yearly</option>
          </select>
        )}
        <button
          onClick={save}
          disabled={pending || !incurredOn}
          className="px-3 py-1.5 bg-dark text-white text-xs rounded-full hover:bg-coral transition-colors disabled:opacity-40"
        >
          {isNew ? "Add" : "Save"}
        </button>
        {!isNew && (
          <button onClick={remove} disabled={pending} className="font-mono text-[11px] text-red-600 hover:underline disabled:opacity-40">
            ×
          </button>
        )}
      </div>
      {error && <span className="font-mono text-[11px] text-red-600 col-span-full">{`// ${error}`}</span>}
    </div>
  );
}
