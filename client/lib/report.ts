import type { LoadDataApiResponse } from "@/lib/api";

function svgToDataUrl(svg: SVGElement) {
  const s = new XMLSerializer().serializeToString(svg);
  const encoded = encodeURIComponent(s)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export function downloadFullReport(ctx: {
  api: LoadDataApiResponse | undefined;
  insightsText: string;
}) {
  const { api, insightsText } = ctx;
  const expenseSvg = document.querySelector(
    "#expense-chart svg",
  ) as SVGElement | null;
  const forecastSvg = document.querySelector(
    "#forecast-chart svg",
  ) as SVGElement | null;
  const expenseImg = expenseSvg ? svgToDataUrl(expenseSvg) : null;
  const forecastImg = forecastSvg ? svgToDataUrl(forecastSvg) : null;

  const date = new Date().toLocaleString();
  const netWorth = api?.summary.netWorth ?? 0;
  const spend = api?.summary.spending.total ?? 0;
  const cs = api?.data.creditScore;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>Finance Report</title>
  <style>
  @page { size: landscape; margin: 16mm; }
  body{font-family:Inter,system-ui,sans-serif;color:#0f172a}
  header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
  .logo{display:flex;align-items:center;gap:8px;font-weight:800;font-size:18px}
  .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
  .card{border:1px solid #e5e7eb;border-radius:12px;padding:12px}
  footer{position:fixed;bottom:8px;right:16px;color:#475569;font-size:12px}
  h2{margin:0 0 8px}
  </style></head><body>`);

  w.document.write(`<header>
    <div class="logo">
      <svg viewBox="0 0 24 24" width="20" height="20"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#F472B6"/></linearGradient></defs><rect x="3" y="3" width="18" height="18" rx="4" fill="url(#g)"/></svg>
      AI Finance — Monthly Report
    </div>
    <div>${date}</div>
  </header>`);

  w.document.write(`<div class="grid">
    <div class="card"><h2>Net Worth</h2><div style="font-size:22px;font-weight:700">$${netWorth.toFixed(0)}</div></div>
    <div class="card"><h2>Expenses (last month)</h2><div style="font-size:22px;font-weight:700">$${spend.toFixed(0)}</div></div>
    <div class="card"><h2>Credit Score</h2><div style="font-size:22px;font-weight:700">${cs ? `${cs.score} (${cs.rating})` : "—"}</div></div>
  </div>`);

  w.document.write(`<div class="grid" style="margin-top:12px">
    <div class="card"><h2>Expense Breakdown</h2>${expenseImg ? `<img src="${expenseImg}" style="max-width:100%"/>` : "No chart"}</div>
    <div class="card"><h2>Savings Forecast</h2>${forecastImg ? `<img src="${forecastImg}" style="max-width:100%"/>` : "No chart"}</div>
    <div class="card"><h2>AI Summary</h2><p>${insightsText}</p></div>
  </div>`);

  w.document.write(`<footer>AI Finance · Page 1</footer>`);
  w.document.write(`<script>setTimeout(()=>window.print(),200)</script>`);
  w.document.write(`</body></html>`);
  w.document.close();
}
