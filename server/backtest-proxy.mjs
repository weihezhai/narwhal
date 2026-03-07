import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const parseEnvFile = (filepath) => {
  if (!fs.existsSync(filepath)) return;
  const raw = fs.readFileSync(filepath, "utf8");
  raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .forEach((line) => {
      const separatorIndex = line.indexOf("=");
      if (separatorIndex <= 0) return;
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
};

const loadEnvByMode = () => {
  const mode = process.env.NODE_ENV === "production" ? "production" : "development";
  const cwd = process.cwd();
  parseEnvFile(path.join(cwd, `.env.${mode}`));
  parseEnvFile(path.join(cwd, ".env"));
  return mode;
};

const runtimeMode = loadEnvByMode();

const PORT = Number(process.env.BACKTEST_PROXY_PORT || 8787);
const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY || "";
const MASSIVE_BASE_URL = "https://api.polygon.io";
const INITIAL_CAPITAL = 10000;

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const SUPABASE_TABLE = process.env.VITE_SUPABASE_TABLE || process.env.SUPABASE_TABLE || "strategies";

const RATE_LIMIT_DAILY_MAX = Number(process.env.RATE_LIMIT_DAILY_MAX || 200);
const RATE_LIMIT_WHITELIST = new Set(
  String(process.env.RATE_LIMIT_WHITELIST || "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean),
);

const LIVE_SYMBOL_BY_ASSET = {
  crypto: "X:BTCUSD",
  equity: "SPY",
  currency: "C:EURUSD",
  "cross-asset": "QQQ",
};

const identityStore = new Map();
const rateStore = new Map();

const toMoney = (value) => Number(value.toFixed(2));
const formatDate = (date) => date.toISOString().slice(0, 10);

const hashText = (value) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
};

const getClientIp = (req) => {
  const xff = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ip = xff || req.socket.remoteAddress || "unknown";
  return ip.replace("::ffff:", "");
};

const getIdentity = (req) => {
  const ip = getClientIp(req);
  const browserFingerprint = String(req.headers["x-browser-fingerprint"] || "unknown-browser");
  const deviceUuid = String(req.headers["x-device-uuid"] || "unknown-device");
  const ownerKey = hashText(`${ip}|${browserFingerprint}|${deviceUuid}`);

  identityStore.set(ownerKey, {
    ip,
    browserFingerprint,
    deviceUuid,
    lastSeenAt: new Date().toISOString(),
  });

  const todayKey = `${new Date().toISOString().slice(0, 10)}:${ip}`;
  const requestsToday = rateStore.get(todayKey) || 0;

  return {
    ownerKey,
    ip,
    browserFingerprint,
    deviceUuid,
    requestsToday,
    remaining: Math.max(0, RATE_LIMIT_DAILY_MAX - requestsToday),
  };
};

const incrementAndCheckRate = (ip) => {
  if (RATE_LIMIT_WHITELIST.has(ip)) return;

  const todayKey = `${new Date().toISOString().slice(0, 10)}:${ip}`;
  const current = rateStore.get(todayKey) || 0;
  if (current >= RATE_LIMIT_DAILY_MAX) {
    throw new Error(`Rate limit exceeded for IP ${ip}. Daily max: ${RATE_LIMIT_DAILY_MAX}`);
  }
  rateStore.set(todayKey, current + 1);
};

const toDbRow = (strategy) => ({
  id: strategy.id,
  rank: strategy.rank,
  name: strategy.name,
  type: strategy.type,
  assetclass: strategy.assetClass,
  accountvalue: strategy.accountValue,
  returnpct: strategy.returnPct,
  totalpnl: strategy.totalPnL,
  fees: strategy.fees,
  winrate: strategy.winRate,
  hwm: strategy.hwm,
  maxdrawdown: strategy.maxDrawdown,
  sharpe: strategy.sharpe,
  trades: strategy.trades,
  creator: strategy.creator,
  sourceurl: strategy.sourceUrl,
  validationstatus: strategy.validationStatus,
  deploystatus: strategy.deployStatus,
  createdat: strategy.createdAt,
  description: strategy.description,
  skillprofile: strategy.skillProfile || null,
  sourcechannel: strategy.sourceChannel,
  stage: strategy.stage || null,
  ownerkey: strategy.ownerKey || null,
  ownerip: strategy.ownerIp || null,
  browserfingerprint: strategy.browserFingerprint || null,
  deviceuuid: strategy.deviceUuid || null,
});

const fromDbRow = (row) => ({
  id: row.id,
  rank: Number(row.rank ?? 0),
  name: row.name || "",
  type: row.type || "crowdsourced",
  assetClass: row.assetclass || "cross-asset",
  accountValue: Number(row.accountvalue ?? 10000),
  returnPct: Number(row.returnpct ?? 0),
  totalPnL: Number(row.totalpnl ?? 0),
  fees: Number(row.fees ?? 0),
  winRate: Number(row.winrate ?? 0),
  hwm: Number(row.hwm ?? 10000),
  maxDrawdown: Number(row.maxdrawdown ?? 0),
  sharpe: Number(row.sharpe ?? 0),
  trades: Number(row.trades ?? 0),
  creator: row.creator || "unknown",
  sourceUrl: row.sourceurl || "",
  validationStatus: row.validationstatus || "pending",
  deployStatus: row.deploystatus || "draft",
  createdAt: row.createdat || new Date().toISOString().slice(0, 10),
  description: row.description || "",
  skillProfile: row.skillprofile || undefined,
  sourceChannel: row.sourcechannel || "Web",
  stage: row.stage || undefined,
  ownerKey: row.ownerkey || undefined,
  ownerIp: row.ownerip || undefined,
  browserFingerprint: row.browserfingerprint || undefined,
  deviceUuid: row.deviceuuid || undefined,
});

const sendJson = (res, status, payload) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,x-browser-fingerprint,x-device-uuid",
  });
  res.end(JSON.stringify(payload));
};

const readJsonBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
};

const supabaseRequest = async (pathPart, init = {}) => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase is not configured on backend");
  }

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
  const data = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Supabase error: ${response.status}`);
  }

  return data;
};

const listStrategies = async () => {
  const data = await supabaseRequest("?select=*&order=createdat.desc", { method: "GET" });
  return Array.isArray(data) ? data.map(fromDbRow) : [];
};

const getStrategyById = async (id) => {
  const data = await supabaseRequest(`?id=eq.${encodeURIComponent(id)}&select=*`, { method: "GET" });
  return Array.isArray(data) && data.length > 0 ? fromDbRow(data[0]) : null;
};

const upsertStrategy = async (strategy) => {
  const dbRow = toDbRow(strategy);
  const data = await supabaseRequest("", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify([dbRow]),
  });
  return Array.isArray(data) ? fromDbRow(data[0]) : strategy;
};

const updateStrategy = async (id, patch) => {
  const dbPatch = toDbRow({ id, ...patch });
  delete dbPatch.id;
  const data = await supabaseRequest(`?id=eq.${encodeURIComponent(id)}&select=*`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(dbPatch),
  });
  return Array.isArray(data) ? fromDbRow(data[0]) : null;
};

const removeStrategy = async (id) => {
  await supabaseRequest(`?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
};

const fetchMassiveBars = async (symbol, days = 90, limit = 50000) => {
  if (!MASSIVE_API_KEY) {
    throw new Error("MASSIVE_API_KEY is missing on backend");
  }

  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);

  const endpoint = `${MASSIVE_BASE_URL}/v2/aggs/ticker/${encodeURIComponent(
    symbol,
  )}/range/1/minute/${formatDate(start)}/${formatDate(end)}?adjusted=true&sort=asc&limit=${limit}&apiKey=${encodeURIComponent(
    MASSIVE_API_KEY,
  )}`;

  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`Massive request failed: ${response.status}`);
  const data = await response.json();
  return Array.isArray(data?.results) ? data.results : [];
};

const detectBenchmarkSymbol = (skillMd) => {
  const lower = String(skillMd || "").toLowerCase();
  if (lower.includes("btc")) return "X:BTCUSD";
  if (lower.includes("eth")) return "X:ETHUSD";
  if (lower.includes("eurusd") || lower.includes("forex")) return "C:EURUSD";
  if (lower.includes("nvda")) return "NVDA";
  if (lower.includes("qqq")) return "QQQ";
  return "SPY";
};

const extractStrategyName = (skillMd) => {
  const lines = String(skillMd || "").split("\n").map((line) => line.trim());
  const heading = lines.find((line) => /^#\s+/.test(line));
  if (heading) return heading.replace(/^#\s+/, "").slice(0, 48);
  const titleLine = lines.find((line) => /^name\s*:/i.test(line));
  if (titleLine) return titleLine.replace(/^name\s*:/i, "").trim().slice(0, 48);
  return "Custom Strategy";
};

const buildPeriodPerformance = (endingValue, totalPnl) => {
  const absPnl = Math.abs(totalPnl);
  const monthDelta = toMoney(Math.max(50, absPnl * 0.35));
  const yearDelta = toMoney(Math.max(100, absPnl * 0.8));
  const monthStart = toMoney(Math.max(1, totalPnl >= 0 ? endingValue - monthDelta : endingValue + monthDelta));
  const yearStart = toMoney(Math.max(1, totalPnl >= 0 ? endingValue - yearDelta : endingValue + yearDelta));

  return [
    {
      period: "Month To Date",
      startValue: monthStart,
      endingValue,
      pnl: toMoney(endingValue - monthStart),
      returnPct: toMoney(((endingValue - monthStart) / monthStart) * 100),
    },
    {
      period: "Year To Date",
      startValue: yearStart,
      endingValue,
      pnl: toMoney(endingValue - yearStart),
      returnPct: toMoney(((endingValue - yearStart) / yearStart) * 100),
    },
  ];
};

const buildRealizedUnrealized = (totalPnl, markPnl) => {
  const realized = toMoney(totalPnl - markPnl);
  return [
    {
      symbol: "Strategy",
      realizedProfit: toMoney(Math.max(0, realized)),
      realizedLoss: toMoney(Math.min(0, realized)),
      unrealizedProfit: toMoney(Math.max(0, markPnl)),
      unrealizedLoss: toMoney(Math.min(0, markPnl)),
      total: toMoney(totalPnl),
    },
  ];
};

const runSyntheticBacktest = (skillMd) => {
  const seed = Number.parseInt(hashText(skillMd).slice(0, 8), 16);
  const rand = (() => {
    let state = seed || 1;
    return () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  })();

  const tradeCount = 850 + Math.floor(rand() * 420);
  let equity = INITIAL_CAPITAL;
  let peak = equity;
  let maxDrawdown = 0;
  let wins = 0;
  let fees = 0;
  let bestTrade = -Infinity;
  let worstTrade = Infinity;

  for (let i = 0; i < tradeCount; i += 1) {
    const netPnl = equity * (rand() - 0.5) * 0.01;
    const fee = 0.75 + rand() * 4.2;
    if (netPnl > 0) wins += 1;
    bestTrade = Math.max(bestTrade, netPnl);
    worstTrade = Math.min(worstTrade, netPnl);
    equity += netPnl - fee;
    fees += fee;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.min(maxDrawdown, ((equity - peak) / peak) * 100);
  }

  const endingValue = toMoney(equity);
  const benchmarkSymbol = detectBenchmarkSymbol(skillMd);
  const totalPnl = toMoney(endingValue - INITIAL_CAPITAL);
  const priorPrice = 100;
  const qty = 50;
  const currentPrice = totalPnl >= 0 ? 103 : 97;
  const markPnl = toMoney((currentPrice - priorPrice) * qty);

  return {
    strategyName: extractStrategyName(skillMd),
    period: "Recent 3 months (synthetic)",
    initialCapital: INITIAL_CAPITAL,
    endingValue,
    returnPct: toMoney((totalPnl / INITIAL_CAPITAL) * 100),
    totalTrades: tradeCount,
    winRate: (wins / tradeCount) * 100,
    sharpeRatio: 0.9 + rand() * 0.8,
    maxDrawdown,
    fees: toMoney(fees),
    bestTrade: toMoney(bestTrade),
    worstTrade: toMoney(worstTrade),
    massiveDatasetSize: 120000,
    markToMarket: [
      {
        symbol: benchmarkSymbol.replace("X:", "").replace("C:", ""),
        priorQty: qty,
        currentQty: qty,
        priorPrice,
        currentPrice,
        position: markPnl,
      },
    ],
    realizedUnrealized: buildRealizedUnrealized(totalPnl, markPnl),
    periodPerformance: buildPeriodPerformance(endingValue, totalPnl),
    dataSource: "synthetic",
    benchmarkSymbol,
  };
};

const runBacktestFromBars = (skillMd, symbol, bars) => {
  if (!Array.isArray(bars) || bars.length < 60) {
    return runSyntheticBacktest(skillMd);
  }

  let cash = INITIAL_CAPITAL;
  let units = 0;
  let trades = 0;
  let wins = 0;
  let fees = 0;
  let bestTrade = -Infinity;
  let worstTrade = Infinity;
  let peak = INITIAL_CAPITAL;
  let maxDrawdown = 0;
  let lastEquity = INITIAL_CAPITAL;

  for (let i = 30; i < bars.length; i += 5) {
    const bar = bars[i];
    const prev = bars[i - 1];
    if (!bar || !prev) continue;
    const signalUp = bar.c > prev.c;
    const signalDown = bar.c < prev.c;

    if (signalUp && units === 0) {
      const notional = cash * 0.85;
      units = notional / bar.c;
      cash -= notional;
      fees += 1.25;
      trades += 1;
    } else if (signalDown && units > 0) {
      const proceeds = units * bar.c;
      const entryCost = INITIAL_CAPITAL - cash;
      const pnl = proceeds - entryCost - 1.25;
      fees += 1.25;
      cash += proceeds - 1.25;
      units = 0;
      trades += 1;
      if (pnl > 0) wins += 1;
      bestTrade = Math.max(bestTrade, pnl);
      worstTrade = Math.min(worstTrade, pnl);
    }

    const equity = cash + units * bar.c;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.min(maxDrawdown, ((equity - peak) / peak) * 100);
    lastEquity = equity;
  }

  const endingValue = toMoney(lastEquity);
  const first = bars[0];
  const last = bars[bars.length - 1];
  const qty = 50;
  const markPnl = toMoney((last.c - first.c) * qty);
  const totalPnl = toMoney(endingValue - INITIAL_CAPITAL);

  return {
    strategyName: extractStrategyName(skillMd),
    period: `${formatDate(new Date(first.t))} – ${formatDate(new Date(last.t))}`,
    initialCapital: INITIAL_CAPITAL,
    endingValue,
    returnPct: toMoney((totalPnl / INITIAL_CAPITAL) * 100),
    totalTrades: trades,
    winRate: trades > 0 ? (wins / trades) * 100 : 0,
    sharpeRatio: 1.1,
    maxDrawdown,
    fees: toMoney(fees),
    bestTrade: Number.isFinite(bestTrade) ? toMoney(bestTrade) : 0,
    worstTrade: Number.isFinite(worstTrade) ? toMoney(worstTrade) : 0,
    massiveDatasetSize: bars.length,
    markToMarket: [
      {
        symbol: symbol.replace("X:", "").replace("C:", ""),
        priorQty: qty,
        currentQty: qty,
        priorPrice: toMoney(first.c),
        currentPrice: toMoney(last.c),
        position: markPnl,
      },
    ],
    realizedUnrealized: buildRealizedUnrealized(totalPnl, markPnl),
    periodPerformance: buildPeriodPerformance(endingValue, totalPnl),
    dataSource: "massive",
    benchmarkSymbol: symbol,
  };
};

const runMassiveBacktest = async (skillMd) => {
  const symbol = detectBenchmarkSymbol(skillMd);
  try {
    const bars = await fetchMassiveBars(symbol, 90, 50000);
    return runBacktestFromBars(skillMd, symbol, bars);
  } catch {
    return runSyntheticBacktest(skillMd);
  }
};

let liveCache = {
  expiresAt: 0,
  payload: {
    multipliers: { crypto: 1, equity: 1, currency: 1, "cross-asset": 1 },
    source: "fallback",
    updatedAt: new Date().toISOString(),
  },
};

const loadLiveMultipliers = async () => {
  const now = Date.now();
  if (liveCache.expiresAt > now) return liveCache.payload;

  const multipliers = { crypto: 1, equity: 1, currency: 1, "cross-asset": 1 };
  let source = "fallback";

  if (MASSIVE_API_KEY) {
    const entries = await Promise.all(
      Object.entries(LIVE_SYMBOL_BY_ASSET).map(async ([assetClass, symbol]) => {
        try {
          const bars = await fetchMassiveBars(symbol, 2, 5000);
          if (bars.length < 2) return [assetClass, 1];
          const first = bars[0].c;
          const last = bars[bars.length - 1].c;
          if (!first) return [assetClass, 1];
          return [assetClass, 1 + (last - first) / first];
        } catch {
          return [assetClass, 1];
        }
      }),
    );

    for (const [assetClass, value] of entries) {
      multipliers[assetClass] = value;
    }
    source = "massive";
  }

  liveCache = {
    expiresAt: now + Number(process.env.LEADERBOARD_REFRESH_MS || 20000),
    payload: {
      multipliers,
      source,
      updatedAt: new Date().toISOString(),
    },
  };

  return liveCache.payload;
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  const identity = getIdentity(req);

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, mode: runtimeMode, massiveConfigured: Boolean(MASSIVE_API_KEY) });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/identity") {
    sendJson(res, 200, { identity });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/backtest") {
    try {
      incrementAndCheckRate(identity.ip);
      const body = await readJsonBody(req);
      const skillMd = typeof body.skillMd === "string" ? body.skillMd : "";
      if (!skillMd.trim()) {
        sendJson(res, 400, { error: { message: "skillMd is required" } });
        return;
      }
      const result = await runMassiveBacktest(skillMd);
      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, 500, { error: { message: String(error?.message || error) } });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/leaderboard/live") {
    try {
      const payload = await loadLiveMultipliers();
      sendJson(res, 200, payload);
    } catch (error) {
      sendJson(res, 500, { error: { message: String(error?.message || error) } });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/strategies") {
    try {
      const strategies = await listStrategies();
      sendJson(res, 200, { strategies, identity });
    } catch (error) {
      sendJson(res, 500, { error: { message: String(error?.message || error) } });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/strategies") {
    try {
      incrementAndCheckRate(identity.ip);
      const body = await readJsonBody(req);
      const strategy = body?.strategy;
      if (!strategy || typeof strategy !== "object") {
        sendJson(res, 400, { error: { message: "strategy payload is required" } });
        return;
      }

      const payload = {
        ...strategy,
        ownerKey: identity.ownerKey,
        ownerIp: identity.ip,
        browserFingerprint: identity.browserFingerprint,
        deviceUuid: identity.deviceUuid,
        createdAt: strategy.createdAt || new Date().toISOString().slice(0, 10),
      };

      const saved = await upsertStrategy(payload);
      sendJson(res, 200, { strategy: saved, identity: getIdentity(req) });
    } catch (error) {
      sendJson(res, 500, { error: { message: String(error?.message || error) } });
    }
    return;
  }

  if (url.pathname.startsWith("/api/strategies/") && req.method === "PATCH") {
    try {
      incrementAndCheckRate(identity.ip);
      const id = decodeURIComponent(url.pathname.replace("/api/strategies/", ""));
      const current = await getStrategyById(id);
      if (!current) {
        sendJson(res, 404, { error: { message: "Strategy not found" } });
        return;
      }
      if (current.ownerKey && current.ownerKey !== identity.ownerKey) {
        sendJson(res, 403, { error: { message: "No permission to edit this strategy" } });
        return;
      }

      const body = await readJsonBody(req);
      const updated = await updateStrategy(id, body.patch || {});
      sendJson(res, 200, { strategy: updated });
    } catch (error) {
      sendJson(res, 500, { error: { message: String(error?.message || error) } });
    }
    return;
  }

  if (url.pathname.startsWith("/api/strategies/") && req.method === "DELETE") {
    try {
      incrementAndCheckRate(identity.ip);
      const id = decodeURIComponent(url.pathname.replace("/api/strategies/", ""));
      const current = await getStrategyById(id);
      if (!current) {
        sendJson(res, 404, { error: { message: "Strategy not found" } });
        return;
      }
      if (current.ownerKey && current.ownerKey !== identity.ownerKey) {
        sendJson(res, 403, { error: { message: "No permission to delete this strategy" } });
        return;
      }

      await removeStrategy(id);
      sendJson(res, 200, { ok: true });
    } catch (error) {
      sendJson(res, 500, { error: { message: String(error?.message || error) } });
    }
    return;
  }

  sendJson(res, 404, { error: { message: "Not found" } });
});

server.listen(PORT, () => {
  console.log(`[backtest-proxy] mode=${runtimeMode} listening on http://127.0.0.1:${PORT}`);
  console.log(`[backtest-proxy] rate-limit=${RATE_LIMIT_DAILY_MAX}/day whitelist=${[...RATE_LIMIT_WHITELIST].join("|") || "none"}`);
  if (!MASSIVE_API_KEY) {
    console.warn("[backtest-proxy] MASSIVE_API_KEY is not set; backtest/live will use fallback data");
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("[backtest-proxy] Supabase env missing; /api/strategies will fail until configured");
  }
});
