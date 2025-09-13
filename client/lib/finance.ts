import type { Liability, Transaction } from "@shared/api";

export function breakdownTopExpenses(transactions: Transaction[], months = 1) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const tx = transactions.filter((t) => new Date(t.date) >= from && (t.type === "expense" || t.amount < 0));
  const map = new Map<string, number>();
  for (const t of tx) map.set(t.category || "Other", (map.get(t.category || "Other") || 0) + Math.abs(t.amount));
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

export function forecastSeries(transactions: Transaction[]) {
  const months = [3, 2, 1].map((m) => new Date(new Date().getFullYear(), new Date().getMonth() - m + 1, 1));
  const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}`;
  const sums = new Map<string, { income: number; expense: number }>();
  for (const d of months) sums.set(monthKey(d), { income: 0, expense: 0 });
  for (const t of transactions) {
    const d = new Date(t.date);
    const key = monthKey(new Date(d.getFullYear(), d.getMonth(), 1));
    if (!sums.has(key)) continue;
    if (t.type === "income" || t.amount > 0) sums.get(key)!.income += t.amount;
    else sums.get(key)!.expense += Math.abs(t.amount);
  }
  const prev = months.map((d) => {
    const k = monthKey(d);
    const s = sums.get(k)!;
    return { label: k, savings: s.income - s.expense };
  });
  const avg = prev.reduce((a, b) => a + b.savings, 0) / (prev.length || 1);
  const next = [1, 2, 3].map((i) => ({ label: `+${i}m`, savings: avg }));
  return [...prev, ...next];
}

export function simulateDebt(
  liabilities: Liability[],
  method: "snowball" | "avalanche",
  monthlyBudget: number,
): { months: number; totalInterest: number } {
  const items = liabilities.map((l) => ({ ...l, balance: l.balance }));
  const order = items
    .slice()
    .sort((a, b) => (method === "snowball" ? a.balance - b.balance : b.interestRate - a.interestRate));

  let months = 0;
  let totalInterest = 0;
  while (order.some((l) => l.balance > 0) && months < 600) {
    months += 1;
    let remaining = monthlyBudget;
    for (const l of order) {
      if (l.balance <= 0) continue;
      const interest = (l.interestRate / 12) * l.balance;
      totalInterest += interest;
      let payment = Math.min(l.balance + interest, remaining);
      if (payment < interest) payment = interest; // at least cover interest
      l.balance = Math.max(0, l.balance + interest - payment);
      remaining -= payment;
    }
    if (remaining <= 0 && order.every((l) => l.balance > 0)) {
      // continue next month
    }
  }
  return { months, totalInterest };
}
