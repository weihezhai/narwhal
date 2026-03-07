import { useState, useEffect, useRef } from "react";
import { type Strategy } from "@/data/mockData";
import { Button as MovingBorderButton } from "@/components/ui/moving-border";
import { KPICard } from "@/components/KPICard";
import { TradingHoursIndicator } from "@/components/TradingHoursIndicator";
import { TickingNumber } from "@/components/TickingNumber";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, TrendingUp, TrendingDown, ArrowRight, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { backendApiUrl } from "@/lib/backend";
import { listStrategies } from "@/lib/strategiesApi";
import { useNavigate, useSearchParams } from "react-router-dom";

type SortKey = "returnPct" | "totalPnL" | "sharpe";
type FilterType = "all" | "crypto" | "equity" | "currency" | "cross-asset";
type AssetClass = "crypto" | "equity" | "currency" | "cross-asset";
type LiveMultipliersResponse = { multipliers?: Partial<Record<AssetClass, number>> };
type SortOrder = "asc" | "desc";
const LEADERBOARD_REFRESH_MS = Number(import.meta.env.VITE_LEADERBOARD_REFRESH_MS || 20000);
const parseNumberLike = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9.+-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export default function Leaderboard() {
  const [sortBy, setSortBy] = useState<SortKey>("returnPct");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [submitUrl, setSubmitUrl] = useState("");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const highlightRef = useRef<HTMLTableRowElement>(null);
  const [liveMultipliers, setLiveMultipliers] = useState<Record<AssetClass, number>>({
    crypto: 1,
    equity: 1,
    currency: 1,
    "cross-asset": 1,
  });
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [updatedAt, setUpdatedAt] = useState(new Date());
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const payload = await listStrategies();
        const rows = payload?.strategies ?? [];
        if (!active) return;
        setStrategies(rows);
        setLoadError("");
        setUpdatedAt(new Date());
      } catch (err: any) {
        if (!active) return;
        setStrategies([]);
        setLoadError(String(err?.message || "Failed to load strategies"));
        setUpdatedAt(new Date());
      }
    };
    load();
    const timer = setInterval(load, LEADERBOARD_REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadLive = async () => {
      try {
        const response = await fetch(backendApiUrl("/api/leaderboard/live"));
        if (!response.ok) return;
        const payload = (await response.json()) as LiveMultipliersResponse;
        if (!active || !payload?.multipliers) return;
        setLiveMultipliers((prev) => ({
          crypto: payload.multipliers?.crypto ?? prev.crypto,
          equity: payload.multipliers?.equity ?? prev.equity,
          currency: payload.multipliers?.currency ?? prev.currency,
          "cross-asset": payload.multipliers?.["cross-asset"] ?? prev["cross-asset"],
        }));
      } catch {
        // Keep previous multipliers when backend is temporarily unavailable.
      }
    };

    loadLive();
    const timer = setInterval(loadLive, LEADERBOARD_REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const h = searchParams.get("highlight");
    if (h) {
      setHighlightId(h);
      // Clean up the URL param
      searchParams.delete("highlight");
      setSearchParams(searchParams, { replace: true });
      // Scroll to highlighted row after render
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
      // Remove highlight after animation
      setTimeout(() => setHighlightId(null), 3000);
    }
  }, []);

  const liveAdjusted = strategies.map((s) => {
    const mult = liveMultipliers[s.assetClass] ?? 1;
    const accountValue = s.accountValue * mult;
    const totalPnL = accountValue - 10000;
    const returnPct = (totalPnL / 10000) * 100;
    return { ...s, accountValue, totalPnL, returnPct };
  });

  const filtered = liveAdjusted.filter(
    (s) => filterType === "all" || s.assetClass === filterType
  );

  const pickSortValue = (s: Strategy): number =>
    parseNumberLike(sortBy === "returnPct" ? s.returnPct : sortBy === "totalPnL" ? s.totalPnL : s.sharpe);

  const sorted = [...filtered].sort((a, b) => {
    const primary = pickSortValue(a) - pickSortValue(b);
    if (primary !== 0) return sortOrder === "asc" ? primary : -primary;
    const secondary = a.name.localeCompare(b.name);
    return sortOrder === "asc" ? secondary : -secondary;
  });

  const topSharpe = liveAdjusted.length > 0 ? Math.max(...liveAdjusted.map((s) => s.sharpe)) : 0;
  const bestReturn = liveAdjusted.length > 0 ? Math.max(...liveAdjusted.map((s) => s.returnPct)) : 0;
  const bestReturnStrategy =
    liveAdjusted.length > 0 ? [...liveAdjusted].sort((a, b) => b.returnPct - a.returnPct)[0] : null;
  const activeAgents = liveAdjusted.length;
  const crowdsourced = liveAdjusted.filter((s) => s.type === "crowdsourced").length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Global <span className="text-gradient">Leaderboard</span>
          </h1>
          <p className="text-muted-foreground">
            Trading strategies ranked by live performance.
          </p>
        </div>
        <div className="flex flex-col items-end justify-end gap-1.5">
          <TradingHoursIndicator />
          <div className="flex gap-4 text-xs font-mono text-muted-foreground">
            <span>Starting Capital: $10,000</span>
            <span>•</span>
            <span>Period: Recent 3 months (1min)</span>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load strategies: {loadError}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Top Sharpe"
          value={topSharpe.toFixed(3)}
          label="Crowdsourced"
        />
        <KPICard
          title="Best Return"
          value={`${bestReturn >= 0 ? "+" : ""}${bestReturn.toFixed(2)}%`}
          label={bestReturnStrategy?.name || "-"}
        />
        <KPICard
          title="Active Strategies"
          value={activeAgents.toString()}
          label={`${crowdsourced} crowdsourced`}
        />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select
            value={filterType}
            onValueChange={(v) => setFilterType(v as FilterType)}
          >
            <SelectTrigger className="w-[180px] bg-card-translucent border-glass-border">
              <Filter className="h-3.5 w-3.5 shrink-0" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Asset Class</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
              <SelectItem value="equity">Equity</SelectItem>
              <SelectItem value="currency">Currency</SelectItem>
              <SelectItem value="cross-asset">Cross Asset</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortKey)}
          >
            <SelectTrigger className="w-[180px] bg-card-translucent border-glass-border">
              <ArrowUpDown className="h-3.5 w-3.5 shrink-0" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="returnPct">Return Rate</SelectItem>
              <SelectItem value="totalPnL">Cumulative P&L</SelectItem>
              <SelectItem value="sharpe">Sharpe Ratio</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
          >
            {sortOrder === "asc" ? "Asc" : "Desc"}
          </Button>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
          <span>{filtered.length} models</span>
          <span>•</span>
          <span>
            Updated{" "}
            {updatedAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
          </span>
        </div>
      </div>

      {/* Ranking Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Strategy / Model</th>
                <th className="px-4 py-3 text-right font-medium">Account Value</th>
                <th className="px-4 py-3 text-right font-medium">Return</th>
                <th className="px-4 py-3 text-right font-medium">Total P&L</th>
                <th className="px-4 py-3 text-right font-medium">Fees</th>
                <th className="px-4 py-3 text-right font-medium">Win Rate</th>
                <th className="px-4 py-3 text-right font-medium">High Water Mark</th>
                <th className="px-4 py-3 text-right font-medium">Max Drawdown</th>
                <th className="px-4 py-3 text-right font-medium">Sharpe</th>
                <th className="px-4 py-3 text-right font-medium">Trades</th>
                <th className="px-4 py-3 text-right font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => {
                const isHighlighted = highlightId && (s.id === highlightId || s.name.toLowerCase().replace(/\s+/g, "-") === highlightId);
                return (
                <tr
                  key={s.id}
                  ref={isHighlighted ? highlightRef : undefined}
                  onClick={() => navigate(`/strategies/${s.id}`)}
                  className={cn(
                    "border-b border-border/30 cursor-pointer transition-colors hover:bg-secondary/30",
                    isHighlighted && "animate-highlight-flash"
                  )}
                >
                  <td className="px-4 py-3 font-mono font-bold text-muted-foreground">
                    {i + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{s.name}</span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] px-1.5 py-0",
                          s.type === "crowdsourced"
                            ? "bg-primary/10 text-primary/70 border-primary/15"
                            : ""
                        )}
                      >
                        {s.type === "crowdsourced" ? "CS" : "LLM"}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <TickingNumber
                      value={s.accountValue}
                      format={(v) => `$${Math.round(v).toLocaleString()}`}
                    />
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-mono font-semibold",
                      s.returnPct >= 0 ? "text-success" : "text-destructive"
                    )}
                  >
                    <span className="flex items-center justify-end gap-1">
                      {s.returnPct >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <TickingNumber
                        value={s.returnPct}
                        format={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`}
                      />
                    </span>
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-mono",
                      s.totalPnL >= 0 ? "text-success" : "text-destructive"
                    )}
                  >
                    <TickingNumber
                      value={s.totalPnL}
                      format={(v) => `${v >= 0 ? "+" : "-"}$${Math.abs(Math.round(v)).toLocaleString()}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    ${s.fees.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <TickingNumber
                      value={s.winRate}
                      format={(v) => `${v.toFixed(1)}%`}
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-success">
                    ${s.hwm.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-destructive">
                    {s.maxDrawdown.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">
                    <TickingNumber
                      value={s.sharpe}
                      format={(v) => v.toFixed(3)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {s.trades}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant="secondary" className={cn(
                      "text-[10px] px-1.5 py-0",
                      s.sourceChannel === "WhatsApp" && "bg-success/10 text-success border-success/20",
                      s.sourceChannel === "OpenClaw" && "bg-primary/10 text-primary border-primary/20"
                    )}>
                      {s.sourceChannel === "WhatsApp" ? "MSG" : s.sourceChannel}
                    </Badge>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Agent Skill */}
      <div className="glass-panel p-6 space-y-3">
        <h3 className="text-lg font-bold">Submit Anything</h3>
        <p className="text-sm text-muted-foreground">
          Paste a URL from X, Redbook, or arXiv. Our engine will extract the trading logic and generate a deployable Agent Skill Profile (Strategy).
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="https://x.com/trader/status/... or arxiv.org/abs/..."
            className="bg-secondary border-border flex-1"
            value={submitUrl}
            onChange={(e) => setSubmitUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              const value = submitUrl.trim();
              if (!value) return;
              navigate(`/submit?url=${encodeURIComponent(value)}`);
            }}
          />
          <MovingBorderButton
            borderRadius="0.5rem"
            className="px-4 py-2 gap-1.5 font-semibold text-sm"
            containerClassName="shrink-0"
            onClick={() => {
              if (submitUrl.trim()) {
                navigate(`/submit?url=${encodeURIComponent(submitUrl.trim())}`);
              }
            }}
          >
            Extract <ArrowRight className="h-4 w-4" />
          </MovingBorderButton>
        </div>
      </div>
    </div>
  );
}
