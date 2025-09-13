import { readFile } from "fs/promises";
import path from "path";
import {
  type ChatResponse,
  type LoadDataResponse,
  type Permissions,
  type Transaction,
  type Liability,
  type DataCategory,
} from "@shared/api";

const sessions = new Map<
  string,
  { history: { role: "user" | "assistant"; content: string }[]; lastTopic?: string }
>();

function dataPath(filename: string) {
  return path.join(process.cwd(), "server", "data", filename);
}

async function loadDataByPermissions(permissions: Permissions): Promise<LoadDataResponse> {
  const out: LoadDataResponse = {};
  const readJson = async <T>(file: string): Promise<T> =>
    JSON.parse(await readFile(dataPath(file), "utf-8"));

  if (permissions.assets) out.assets = await readJson("assets.json");
  if (permissions.liabilities) out.liabilities = await readJson("liabilities.json");
  if (permissions.transactions) out.transactions = await readJson("transactions.json");
  if (permissions.epf) out.epf = await readJson("epf.json");
  if (permissions.creditScore) out.creditScore = await readJson("creditScore.json");
  if (permissions.investments) out.investments = await readJson("investments.json");
  return out;
}

function parseTimeframe(message: string): { months?: number; period?: "month" | "quarter" | "months" } {
  const lower = message.toLowerCase();
  if (/last\s*month/.test(lower)) return { months: 1, period: "month" };
  if (/last\s*quarter/.test(lower)) return { months: 3, period: "quarter" };
  const m = lower.match(/last\s*(\d+)\s*months?/);
  if (m) return { months: Math.max(1, parseInt(m[1], 10)), period: "months" };
  return {};
}

function isExpense(t: Transaction) {
  return t.type === "expense" || t.amount < 0;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthsAgo(date: Date, n: number) {
  return new Date(date.getFullYear(), date.getMonth() - n, 1);
}

function filterTransactionsByMonths(transactions: Transaction[], months = 1) {
  const now = new Date();
  const from = monthsAgo(startOfMonth(now), months - 1);
  return transactions.filter((t) => new Date(t.date) >= from);
}

function sum(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0);
}

function groupBy<T, K extends string>(list: T[], key: (item: T) => K): Record<K, T[]> {
  return list.reduce((acc, item) => {
    const k = key(item);
    (acc[k] ||= [] as any).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

function spendingSummary(transactions: Transaction[], months = 1) {
  const tx = filterTransactionsByMonths(transactions, months).filter(isExpense);
  const total = -sum(tx.map((t) => t.amount));
  const byCat = groupBy(tx, (t) => t.category || "Other");
  const top = Object.entries(byCat)
    .map(([k, v]) => ({ category: k, total: -sum(v.map((t) => t.amount)) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);
  return { total, top, months };
}

function detectUnusualSpending(transactions: Transaction[]) {
  // Compare last month vs average of prior 3 months
  const last = spendingSummary(transactions, 1).total;
  const prev3 = filterTransactionsByMonths(transactions, 4)
    .filter((t) => new Date(t.date) < startOfMonth(new Date()))
    .filter(isExpense);
  // Split previous 3 months
  const now = new Date();
  const monthBuckets = [1, 2, 3].map((m) =>
    prev3.filter((t) => new Date(t.date) >= monthsAgo(startOfMonth(now), m) && new Date(t.date) < monthsAgo(startOfMonth(now), m - 1)),
  );
  const prevTotals = monthBuckets.map((b) => -sum(b.map((t) => t.amount)));
  const avgPrev = prevTotals.length ? sum(prevTotals) / prevTotals.length : 0;
  const unusual = avgPrev > 0 && last > avgPrev * 1.2;
  return { unusual, last, avgPrev, increasePct: avgPrev ? (last - avgPrev) / avgPrev : 0 };
}

function savingsForecast(transactions: Transaction[]) {
  // Estimate monthly net = avg(income) - avg(expense) over last 3 months
  const tx = filterTransactionsByMonths(transactions, 3);
  const income = sum(tx.filter((t) => t.type === "income" || t.amount > 0).map((t) => t.amount));
  const expenses = -sum(tx.filter(isExpense).map((t) => t.amount));
  const monthlyNet = (income - expenses) / 3;
  const forecast3 = monthlyNet * 3;
  return { monthlyNet, forecast3 };
}

function chooseDebtStrategy(liabilities: Liability[]) {
  if (!liabilities.length) return { method: "none", rationale: "No liabilities found." } as const;
  const highestAPR = liabilities.reduce((a, b) => (a.interestRate > b.interestRate ? a : b));
  const lowestBalance = liabilities.reduce((a, b) => (a.balance < b.balance ? a : b));
  // Recommend avalanche if any APR >= 10%, else snowball
  const method = highestAPR.interestRate >= 0.1 ? "avalanche" : "snowball";
  const target = method === "avalanche" ? highestAPR : lowestBalance;
  const rationale =
    method === "avalanche"
      ? `Highest APR is ${(highestAPR.interestRate * 100).toFixed(1)}% on ${highestAPR.name}. Paying it first minimizes total interest.`
      : `Smallest balance is $${lowestBalance.balance.toFixed(0)} on ${lowestBalance.name}. Paying it first builds momentum.`;
  return { method, target: target.name, rationale } as const;
}

export async function handleChat(
  message: string,
  sessionId: string,
  permissions: Permissions,
): Promise<ChatResponse> {
  const session = sessions.get(sessionId) ?? { history: [] };
  const time = parseTimeframe(message);
  const data = await loadDataByPermissions(permissions);

  const used = new Set<DataCategory>();
  const replyParts: string[] = [];
  const insights: ChatResponse["insights"] = [];

  const ask = message.toLowerCase();
  let topic: "spending" | "afford" | "debt" | "general" = "general";

  if (/spend|spent|expense|expenses/.test(ask)) topic = "spending";
  else if (/afford|vacation|trip|save/.test(ask)) topic = "afford";
  else if (/loan|debt|repay|payoff/.test(ask)) topic = "debt";
  else if (session.lastTopic && /last\s*\d*\s*(months?|month|quarter)/.test(ask)) topic = session.lastTopic as any;

  if (topic === "spending") {
    if (!data.transactions) {
      replyParts.push("I need access to Transactions to analyze your spending.");
    } else {
      used.add("transactions");
      const months = time.months ?? 1;
      const s = spendingSummary(data.transactions, months);
      replyParts.push(
        `You spent $${s.total.toFixed(0)} over the last ${months === 1 ? "month" : months + " months"}. Top categories: ${s.top
          .map((c) => `${c.category} ($${c.total.toFixed(0)})`)
          .join(", ")}.`,
      );
      const u = detectUnusualSpending(data.transactions);
      insights.push({
        id: "spending-anomaly",
        title: u.unusual ? "Unusual spending detected" : "Spending looks normal",
        description: u.unusual
          ? `Last month spending $${u.last.toFixed(0)} is ${(u.increasePct * 100).toFixed(0)}% above your 3-month average $${u.avgPrev.toFixed(0)}. Consider cutting variable costs (dining, subscriptions).`
          : "Your last month spending is within 20% of your 3-month average.",
        severity: u.unusual ? "warning" : "info",
        usedCategories: ["transactions"],
      });
    }
  } else if (topic === "afford") {
    if (!data.transactions) {
      replyParts.push("I need access to Transactions to estimate affordability.");
    } else {
      used.add("transactions");
      const f = savingsForecast(data.transactions);
      replyParts.push(
        `Your average monthly net is $${f.monthlyNet.toFixed(0)}. In the next 3 months, you could save about $${f.forecast3.toFixed(0)} if patterns continue.`,
      );
      insights.push({
        id: "savings-forecast",
        title: "Savings forecast (3 months)",
        description: `Projected savings: $${f.forecast3.toFixed(0)} based on recent income and expenses.`,
        severity: "info",
        usedCategories: ["transactions"],
      });
    }
  } else if (topic === "debt") {
    if (!data.liabilities) {
      replyParts.push("I need access to Liabilities to suggest a repayment strategy.");
    } else {
      used.add("liabilities");
      const strat = chooseDebtStrategy(data.liabilities);
      if (strat.method === "none") replyParts.push(strat.rationale);
      else replyParts.push(`Recommend ${strat.method.toUpperCase()} method. ${strat.rationale}`);
      insights.push({
        id: "debt-strategy",
        title: "Debt Repayment Strategy",
        description: replyParts[replyParts.length - 1],
        severity: "info",
        usedCategories: ["liabilities"],
      });
    }
  } else {
    // General: provide quick dashboard summary based on allowed data
    if (data.assets) used.add("assets");
    if (data.liabilities) used.add("liabilities");
    if (data.transactions) used.add("transactions");
    if (data.creditScore) used.add("creditScore");
    const assetsTotal = (data.assets ?? []).reduce((s, a) => s + a.value, 0);
    const liabilitiesTotal = (data.liabilities ?? []).reduce((s, l) => s + l.balance, 0);
    const netWorth = assetsTotal - liabilitiesTotal;
    replyParts.push(
      `Here's a quick summary${used.size ? " based on your permitted data" : ""}. Net worth: $${netWorth.toFixed(0)}.`,
    );
  }

  session.history.push({ role: "user", content: message });
  const reply = replyParts.join(" ");
  session.history.push({ role: "assistant", content: reply });
  session.lastTopic = topic;
  sessions.set(sessionId, session);

  return { reply, usedCategories: Array.from(used), insights };
}

export async function computeDashboard(data: LoadDataResponse) {
  const assetsTotal = (data.assets ?? []).reduce((s, a) => s + a.value, 0);
  const liabilitiesTotal = (data.liabilities ?? []).reduce((s, l) => s + l.balance, 0);
  const netWorth = assetsTotal - liabilitiesTotal;
  const tx = data.transactions ?? [];
  const spend = spendingSummary(tx, 1);
  const unusual = tx.length ? detectUnusualSpending(tx) : null;
  return {
    netWorth,
    spending: spend,
    unusual,
  };
}
