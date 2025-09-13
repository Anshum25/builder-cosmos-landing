import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchLoadData } from "@/lib/api";
import { usePermissions } from "@/context/PermissionsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Lock, Unlock, ArrowRight, Wallet, TrendingDown, ShieldCheck, FileText } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RTooltip } from "recharts";
import { breakdownTopExpenses, forecastSeries, simulateDebt } from "@/lib/finance";

export default function Index() {
  const { permissions, setPermission } = usePermissions();
  const qc = useQueryClient();
  const { data, refetch } = useQuery({ queryKey: ["load-data", permissions], queryFn: fetchLoadData });

  useEffect(() => {
    const es = new EventSource("/api/stream");
    es.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data);
        if (evt.type === "transaction" || evt.type === "permissions") qc.invalidateQueries({ queryKey: ["load-data"] });
      } catch {}
    };
    return () => es.close();
  }, [qc]);

  useEffect(() => {
    refetch();
  }, [permissions, refetch]);

  const netWorth = data?.summary.netWorth ?? 0;
  const spending = data?.summary.spending;
  const unusual = data?.summary.unusual;
  const forecast = data?.summary.forecast;
  const creditScore = data?.data.creditScore;

  const tx = data?.data.transactions ?? [];
  const pie = useMemo(() => (tx.length ? breakdownTopExpenses(tx, 1) : []), [tx]);
  const series = useMemo(() => (tx.length ? forecastSeries(tx) : []), [tx]);

  const debtSim = useMemo(() => {
    if (!data?.data.liabilities || !tx.length) return null;
    const last3Income = series.slice(0, 3).reduce((s, p) => s + Math.max(0, p.savings), 0) / 3;
    const budget = Math.max(100, last3Income * 0.6);
    return {
      snowball: simulateDebt(data.data.liabilities, "snowball", budget),
      avalanche: simulateDebt(data.data.liabilities, "avalanche", budget),
      budget,
    };
  }, [data?.data.liabilities, series]);

  const COLORS = ["#6366F1", "#A78BFA", "#F472B6", "#06B6D4", "#F59E0B"];

  const PermToggle = ({ k, label }: { k: keyof typeof permissions; label: string }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="secondary" className="ml-1">{permissions[k] ? "Granted" : "Revoked"}</Badge>
      </div>
      <Switch checked={permissions[k]} onCheckedChange={(v) => setPermission(k, v)} />
    </div>
  );

  const InsightCard = ({ title, desc, cats, warning }: { title: string; desc: string; cats: { key: string; allowed: boolean }[]; warning?: boolean }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={warning ? "border-red-300 bg-red-50" : undefined}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <div className="flex gap-1">
            {cats.map((c) => (
              <Badge key={c.key} variant={c.allowed ? "default" : "secondary"} className="flex items-center gap-1">
                {c.allowed ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {c.key}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </CardContent>
      </Card>
    </motion.div>
  );

  function generatePdf() {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Monthly Finance Report</title><style>body{font-family:Inter,system-ui,sans-serif;padding:24px;} h1{font-size:20px;margin:0 0 12px} .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px} .card{border:1px solid #e5e7eb;border-radius:8px;padding:12px}</style></head><body>`);
    w.document.write(`<h1>Monthly Finance Report</h1>`);
    w.document.write(`<div class="grid">`);
    w.document.write(`<div class="card"><strong>Net Worth</strong><div>$${netWorth.toFixed(0)}</div></div>`);
    w.document.write(`<div class="card"><strong>Income vs Expenses (last month)</strong><div>$${(spending?.total ?? 0).toFixed(0)} expenses</div></div>`);
    if (creditScore) w.document.write(`<div class="card"><strong>Credit Score</strong><div>${creditScore.score} (${creditScore.rating})</div></div>`);
    w.document.write(`</div>`);
    w.document.write(`<p style="margin-top:12px">AI Summary: ${unusual?.unusual ? `Spending was ${(unusual.increasePct * 100).toFixed(0)}% above average.` : `Spending is within normal range.`}</p>`);
    w.document.write(`<script>window.print()</script></body></html>`);
    w.document.close();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50">
      <section className="container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Let AI Speak to Your Money</h1>
                  <p className="text-white/80 mt-1">Connect mock financial data, chat naturally, and get actionable insights with full privacy control.</p>
                </div>
                <div className="flex gap-3">
                  <Button asChild variant="secondary">
                    <a href="/chat" className="inline-flex items-center">Ask a Question <ArrowRight className="ml-2 h-4 w-4" /></a>
                  </Button>
                  <Button variant="secondary" onClick={generatePdf} className="bg-white/20 hover:bg-white/30">
                    <FileText className="h-4 w-4 mr-2" /> PDF Report
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Wallet className="h-4 w-4" /> Net Worth</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${netWorth.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Assets and liabilities are required</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><TrendingDown className="h-4 w-4" /> Last Month Spend</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${(spending?.total ?? 0).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Needs Transactions permission</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Credit Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{creditScore ? creditScore.score : "—"}</p>
                  <p className="text-xs text-muted-foreground">{creditScore ? creditScore.rating : "Grant Credit Score access"}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown (Top 5)</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  {tx.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pie} dataKey="value" nameKey="name" outerRadius={90}>
                          {pie.map((entry, index) => (
                            <Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground">Enable Transactions to see breakdown.</p>) }
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Savings Forecast</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  {tx.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={series}>
                        <XAxis dataKey="label" hide={false} />
                        <YAxis hide={false} />
                        <RTooltip />
                        <Line type="monotone" dataKey="savings" stroke="#6366F1" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground">Enable Transactions to see forecast.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InsightCard
                title="Spending Pattern Analysis"
                desc={
                  unusual
                    ? unusual.unusual
                      ? `Unusual spending detected: last month $${unusual.last.toFixed(0)} vs. avg $${unusual.avgPrev.toFixed(0)}.`
                      : "Your spending is within a normal range (±20% of average)."
                    : "Grant Transactions access to analyze spending patterns."
                }
                cats={[{ key: "transactions", allowed: !!data?.data.transactions }]}
                warning={!!unusual?.unusual}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Debt Payoff Simulator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {debtSim ? (
                    <div className="text-sm">
                      <div className="mb-2 text-muted-foreground">Assumed monthly budget: ${debtSim.budget.toFixed(0)}</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-md border p-2">
                          <div className="font-medium">Snowball</div>
                          <div>Months: {debtSim.snowball.months}</div>
                          <div>Total Interest: ${debtSim.snowball.totalInterest.toFixed(0)}</div>
                        </div>
                        <div className="rounded-md border p-2">
                          <div className="font-medium">Avalanche</div>
                          <div>Months: {debtSim.avalanche.months}</div>
                          <div>Total Interest: ${debtSim.avalanche.totalInterest.toFixed(0)}</div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">Choose based on your preference for speed (Snowball motivation) or interest savings (Avalanche).</div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Enable Liabilities and Transactions to simulate payoff.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Data Access Control Panel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <PermToggle k="assets" label="Assets" />
                <Separator />
                <PermToggle k="liabilities" label="Liabilities" />
                <Separator />
                <PermToggle k="transactions" label="Transactions" />
                <Separator />
                <PermToggle k="epf" label="EPF / Retirement" />
                <Separator />
                <PermToggle k="creditScore" label="Credit Score" />
                <Separator />
                <PermToggle k="investments" label="Investments" />
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground mt-3">Toggle categories to grant or revoke access. Insights refresh automatically.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
