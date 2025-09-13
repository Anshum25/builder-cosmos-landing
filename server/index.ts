import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { computeDashboard, handleChat } from "./insightEngine";
import type { Permissions, ChatRequest, LoadDataResponse } from "@shared/api";

function dataPath(filename: string) {
  return path.join(process.cwd(), "server", "data", filename);
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(dataPath(file), "utf-8"));
  } catch {
    return fallback;
  }
}

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Permissions API
  app.get("/api/permissions", async (_req, res) => {
    const perms = await readJson<Permissions>("permissions.json", {
      assets: false,
      liabilities: false,
      transactions: false,
      epf: false,
      creditScore: false,
      investments: false,
    });
    res.json(perms);
  });

  app.post("/api/permissions", async (req, res) => {
    const body = req.body as Partial<Permissions> | undefined;
    if (!body) return res.status(400).json({ error: "Missing body" });
    const current = await readJson<Permissions>("permissions.json", {
      assets: false,
      liabilities: false,
      transactions: false,
      epf: false,
      creditScore: false,
      investments: false,
    });
    const updated: Permissions = {
      assets: body.assets ?? current.assets,
      liabilities: body.liabilities ?? current.liabilities,
      transactions: body.transactions ?? current.transactions,
      epf: body.epf ?? current.epf,
      creditScore: body.creditScore ?? current.creditScore,
      investments: body.investments ?? current.investments,
    };
    await writeFile(dataPath("permissions.json"), JSON.stringify(updated, null, 2), "utf-8");
    res.json(updated);
  });

  // Load data by permissions
  app.get("/api/load-data", async (_req, res) => {
    const perms = await readJson<Permissions>("permissions.json", {
      assets: false,
      liabilities: false,
      transactions: false,
      epf: false,
      creditScore: false,
      investments: false,
    });

    const read = async <T>(file: string): Promise<T> => JSON.parse(await readFile(dataPath(file), "utf-8"));
    const out: LoadDataResponse = {};
    if (perms.assets) out.assets = await read("assets.json");
    if (perms.liabilities) out.liabilities = await read("liabilities.json");
    if (perms.transactions) out.transactions = await read("transactions.json");
    if (perms.epf) out.epf = await read("epf.json");
    if (perms.creditScore) out.creditScore = await read("creditScore.json");
    if (perms.investments) out.investments = await read("investments.json");

    const summary = await computeDashboard(out);

    res.json({ permissions: perms, data: out, summary });
  });

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    const body = req.body as ChatRequest | undefined;
    if (!body || !body.message || !body.sessionId) {
      return res.status(400).json({ error: "Missing message or sessionId" });
    }
    const perms = await readJson<Permissions>("permissions.json", {
      assets: false,
      liabilities: false,
      transactions: false,
      epf: false,
      creditScore: false,
      investments: false,
    });

    const response = await handleChat(body.message, body.sessionId, perms);
    res.json(response);
  });

  return app;
}
