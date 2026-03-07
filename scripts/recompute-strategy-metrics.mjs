#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const modeArg = [...args].find((arg) => arg.startsWith("--mode="));
const envMode = (modeArg ? modeArg.split("=")[1] : process.env.NODE_ENV || "development").toLowerCase();

const root = process.cwd();
const envFile = envMode === "production" ? ".env.production" : ".env.development";
const envPath = path.join(root, envFile);

const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return {};
  const text = fs.readFileSync(filePath, "utf8");
  const out = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    out[key] = value;
  }
  return out;
};

const fileEnv = parseEnvFile(envPath);
const readEnv = (key, fallback = "") => process.env[key] || fileEnv[key] || fallback;

const SUPABASE_URL = String(readEnv("SUPABASE_URL") || readEnv("VITE_SUPABASE_URL")).replace(/\/+$/, "");
const SUPABASE_KEY = String(readEnv("SUPABASE_SERVICE_ROLE_KEY") || readEnv("VITE_SUPABASE_ANON_KEY"));
const SUPABASE_TABLE = String(readEnv("SUPABASE_TABLE") || readEnv("VITE_SUPABASE_TABLE") || "strategies");
const DEFAULT_INITIAL_CAPITAL = Number(readEnv("DEFAULT_INITIAL_CAPITAL", "10000")) || 10000;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(`[recompute] Missing Supabase env. Checked ${envPath} and process env.`);
  process.exit(1);
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};
const round = (value, digits = 3) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const m = 10 ** digits;
  return Math.round(n * m) / m;
};

const inferInitialCapital = (row) => {
  const accountValue = toNumber(row.accountvalue, DEFAULT_INITIAL_CAPITAL);
  const totalPnl = toNumber(row.totalpnl, accountValue - DEFAULT_INITIAL_CAPITAL);
  const inferred = accountValue - totalPnl;
  if (Number.isFinite(inferred) && inferred > 0) return inferred;
  return DEFAULT_INITIAL_CAPITAL;
};

const recomputeMetrics = (row) => {
  const accountValue = toNumber(row.accountvalue, DEFAULT_INITIAL_CAPITAL);
  const existingHwm = toNumber(row.hwm, DEFAULT_INITIAL_CAPITAL);
  const existingMaxDd = toNumber(row.maxdrawdown, 0);
  const existingSharpe = toNumber(row.sharpe, 0);
  const returnPct = toNumber(row.returnpct, 0);
  const winRate = toNumber(row.winrate, 0);
  const trades = Math.max(0, toNumber(row.trades, 0));
  const initialCapital = inferInitialCapital(row);

  const hwm = Math.max(existingHwm, accountValue, initialCapital);
  const drawdownFromPeak = hwm > 0 ? (accountValue / hwm - 1) * 100 : 0;
  const maxDrawdown = Math.min(0, existingMaxDd, drawdownFromPeak);

  let sharpe = existingSharpe;
  if (!Number.isFinite(sharpe) || Math.abs(sharpe) < 1e-12) {
    const ddFloor = Math.max(1, Math.abs(maxDrawdown));
    const raw = returnPct / ddFloor;
    const tradeAdj = clamp(Math.sqrt(Math.max(trades, 1)) / 6, 0.5, 1.8);
    const winAdj = 1 + clamp((winRate - 50) / 100, -0.25, 0.25);
    sharpe = clamp(raw * tradeAdj * winAdj, -9.999, 9.999);
  }

  return {
    hwm: round(hwm, 3),
    maxdrawdown: round(maxDrawdown, 3),
    sharpe: round(sharpe, 3),
  };
};

const supabaseRequest = async (pathPart, init = {}) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}${pathPart}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const raw = await response.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }
  if (!response.ok) {
    throw new Error(typeof data === "object" ? data?.message || data?.error || `Supabase error: ${response.status}` : String(data));
  }
  return data;
};

const main = async () => {
  console.log(`[recompute] mode=${envMode} apply=${apply} table=${SUPABASE_TABLE}`);
  const rows = await supabaseRequest("?select=id,name,accountvalue,totalpnl,returnpct,winrate,hwm,maxdrawdown,sharpe,trades&order=createdat.desc", { method: "GET" });
  if (!Array.isArray(rows) || rows.length === 0) {
    console.log("[recompute] no rows");
    return;
  }

  let changed = 0;
  for (const row of rows) {
    const next = recomputeMetrics(row);
    const prev = {
      hwm: round(toNumber(row.hwm, 0), 3),
      maxdrawdown: round(toNumber(row.maxdrawdown, 0), 3),
      sharpe: round(toNumber(row.sharpe, 0), 3),
    };
    const dirty = prev.hwm !== next.hwm || prev.maxdrawdown !== next.maxdrawdown || prev.sharpe !== next.sharpe;
    if (!dirty) continue;
    changed += 1;

    console.log(
      `[recompute] ${row.id} ${row.name || ""}\n` +
      `  hwm: ${prev.hwm} -> ${next.hwm}\n` +
      `  maxdrawdown: ${prev.maxdrawdown} -> ${next.maxdrawdown}\n` +
      `  sharpe: ${prev.sharpe} -> ${next.sharpe}`,
    );

    if (apply) {
      await supabaseRequest(`?id=eq.${encodeURIComponent(row.id)}&select=id`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(next),
      });
    }
  }

  console.log(`[recompute] scanned=${rows.length} changed=${changed} apply=${apply}`);
};

main().catch((err) => {
  console.error(`[recompute] failed: ${String(err?.message || err)}`);
  process.exit(1);
});

