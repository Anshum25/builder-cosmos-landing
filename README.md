# AI-Powered Personal Finance Assistant

Let AI speak to your money. Connect mock financial data, chat naturally, get insights, and control privacy.

## Run locally

- pnpm install
- pnpm dev
- Open the provided preview URL

## Features
- React + TypeScript + Tailwind + ShadCN + Framer Motion UI
- Express backend with mock JSON data (assets, liabilities, transactions, epf, credit score, investments)
- Permissions API: GET/POST /api/permissions
- Data API: GET /api/load-data (returns permitted data + summary)
- Chat API: POST /api/chat (session-aware, follow-ups, insights, missingPermissions)
- Real-time: Server-Sent Events at /api/stream; random transactions every 30s auto-refresh dashboard
- Insights: spending anomaly, savings forecast, debt strategy
- Charts: expense breakdown pie, savings forecast line (Recharts)
- Debt Payoff Simulator (Snowball vs Avalanche)
- Voice input + TTS reply (Web Speech API)
- PDF “Monthly Finance Report” generator
- Dark mode toggle

## Sample questions
- How much did I spend last month?
- Why did my expenses increase last quarter?
- Can I afford to take a vacation next month?
- What's my best option for repaying my loan faster?
- What about last 3 months?

## Notes
- Data stored in server/data/*.json; permissions in server/data/permissions.json
- SSE and mock generator run automatically in dev
