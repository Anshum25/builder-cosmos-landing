import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLoadData } from "@/lib/api";
import { usePermissions } from "@/context/PermissionsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Lock, Unlock, ArrowRight, Wallet, TrendingDown, TrendingUp, ShieldCheck } from "lucide-react";

export default function Index() {
  const { permissions, setPermission, refresh } = usePermissions();
  const { data, refetch, isFetching } = useQuery({ queryKey: ["load-data", permissions], queryFn: fetchLoadData });

  useEffect(() => {
    refetch();
  }, [permissions, refetch]);

  const netWorth = data?.summary.netWorth ?? 0;
  const spending = data?.summary.spending;
  const unusual = data?.summary.unusual;
  const creditScore = data?.data.creditScore;

  const PermToggle = ({ k, label }: { k: keyof typeof permissions; label: string }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="secondary" className="ml-1">{permissions[k] ? "Granted" : "Revoked"}</Badge>
      </div>
      <Switch checked={permissions[k]} onCheckedChange={(v) => setPermission(k, v)} />
    </div>
  );

  const InsightCard = ({
    title,
    desc,
    cats,
  }: {
    title: string;
    desc: string;
    cats: { key: string; allowed: boolean }[];
  }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
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

            <Card>
              <CardHeader>
                <CardTitle>Spending Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {spending ? (
                  <div className="space-y-2">
                    {spending.top.map((t) => (
                      <div key={t.category} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t.category}</span>
                        <span className="font-medium">${t.total.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Grant Transactions access to see spending by category.</p>
                )}
              </CardContent>
            </Card>

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
              />

              <InsightCard
                title="Savings Forecast (3 months)"
                desc={spending ? `Based on recent patterns, you could save around $${(spending.total > 0 ? 0 : 0).toFixed(0)}. Ask in Chat for details!` : "Grant Transactions to estimate savings forecast."}
                cats={[{ key: "transactions", allowed: !!data?.data.transactions }]}
              />

              <InsightCard
                title="Debt Repayment Strategy"
                desc={data?.data.liabilities ? "We recommend a strategy based on interest rates or balances. Ask in Chat for a personalized plan." : "Grant Liabilities access to receive a debt repayment suggestion."}
                cats={[{ key: "liabilities", allowed: !!data?.data.liabilities }]}
              />
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
