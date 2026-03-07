import { useEffect, useState } from "react";
import { type Strategy } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { ExternalLink, User, CheckCircle, Clock, XCircle, Rocket, Filter, ArrowUpDown, Pencil, Trash2, Plus } from "lucide-react";
import { deleteStrategy, getIdentity, listStrategies, updateStrategy } from "@/lib/strategiesApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SortKey = "returnPct" | "totalPnL" | "sharpe";
type FilterStatus = "all" | "validated" | "pending" | "invalid";
type TabValue = "all" | "my";
type SortOrder = "asc" | "desc";
const parseNumberLike = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9.+-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export default function Strategies() {
  const [sortBy, setSortBy] = useState<SortKey>("returnPct");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [ownerKey, setOwnerKey] = useState("");
  const [actionError, setActionError] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [payload, identity] = await Promise.all([
        listStrategies().catch(() => ({ strategies: [] })),
        getIdentity().catch(() => null),
      ]);
      const rows = payload?.strategies ?? [];
      if (!active) return;
      setStrategies(rows);
      setOwnerKey(identity?.ownerKey || "");
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const editStrategy = async (strategy: Strategy) => {
    const name = window.prompt("Strategy name", strategy.name);
    if (!name) return;
    const description = window.prompt("Description", strategy.description) ?? strategy.description;
    const updated = await updateStrategy(strategy.id, { name, description });
    setStrategies((prev) => prev.map((item) => (item.id === strategy.id ? { ...item, ...updated } : item)));
  };

  const isOwnedByCurrentClient = (s: Strategy) => Boolean(ownerKey) && s.ownerKey === ownerKey;

  const removeStrategy = async (strategy: Strategy) => {
    if (!isOwnedByCurrentClient(strategy)) {
      setActionError("Only your own strategies can be deleted.");
      return;
    }
    try {
      setActionError("");
      await deleteStrategy(strategy.id);
      setStrategies((prev) => prev.filter((item) => item.id !== strategy.id));
    } catch (err: any) {
      setActionError(String(err?.message || "Delete failed."));
    }
  };

  const tabFiltered = activeTab === "my" ? strategies.filter((s) => s.ownerKey === ownerKey) : strategies;

  const filtered = tabFiltered
    .filter((s) => filterStatus === "all" || s.validationStatus === filterStatus)
    .filter((s) => s.name.toLowerCase().includes(nameQuery.trim().toLowerCase()));

  const pickSortValue = (s: Strategy): number =>
    parseNumberLike(sortBy === "returnPct" ? s.returnPct : sortBy === "totalPnL" ? s.totalPnL : s.sharpe);

  const sorted = [...filtered].sort((a, b) => {
    const primary = pickSortValue(a) - pickSortValue(b);
    if (primary !== 0) return sortOrder === "asc" ? primary : -primary;
    const secondary = a.name.localeCompare(b.name);
    return sortOrder === "asc" ? secondary : -secondary;
  });

  const statusIcon = (status: string) => {
    if (status === "validated") return <CheckCircle className="h-3.5 w-3.5 text-success" />;
    if (status === "pending") return <Clock className="h-3.5 w-3.5 text-warning" />;
    return <XCircle className="h-3.5 w-3.5 text-destructive" />;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Strategy <span className="text-gradient">Repository</span>
        </h1>
        <p className="text-muted-foreground">
          Browse, explore, and fork trading strategies.
        </p>
      </div>
      {actionError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="h-11 p-1">
          <TabsTrigger value="all" className="h-9 px-8 gap-1.5 text-sm data-[state=active]:text-primary">
            <Rocket className="h-4 w-4" />
            All Strategies
          </TabsTrigger>
          <TabsTrigger value="my" className="h-9 px-8 gap-1.5 text-sm data-[state=active]:text-primary">
            <User className="h-4 w-4" />
            My Strategies
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <Input
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
          placeholder="Search strategy name"
          className="w-[220px] bg-card-translucent border-glass-border"
        />
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
          <SelectTrigger className="w-[180px] bg-card-translucent border-glass-border">
            <Filter className="h-3.5 w-3.5 shrink-0" />
            <SelectValue placeholder="Validation status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="validated">Validated</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="invalid">Invalid</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
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
        <Button size="sm" className="gap-1.5" onClick={() => navigate("/submit")}>
          <Plus className="h-3.5 w-3.5" /> New Strategy
        </Button>
      </div>

      {/* Strategy Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-12">No strategies found.</p>
        )}
        {sorted.map((s) => (
          (() => {
            const isOwned = isOwnedByCurrentClient(s);
            const effectiveType = s.type === "my-strategy" && !isOwned ? "crowdsourced" : s.type;
            return (
          <div
            key={s.id}
            onClick={() => navigate(`/strategies/${s.id}`)}
            className="glass-panel-hover p-5 cursor-pointer space-y-4"
          >
            <div className="flex items-center justify-end gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                disabled={!isOwned}
                onClick={(e) => {
                  e.stopPropagation();
                  editStrategy(s);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive"
                disabled={!isOwned}
                onClick={(e) => {
                  e.stopPropagation();
                  removeStrategy(s);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{s.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <User className="h-3 w-3" />
                  {s.creator}
                </div>
                {s.sourceChannel !== "Web" && (
                  <Badge variant="secondary" className={cn(
                    "text-[9px] px-1.5 py-0 mt-1",
                    s.sourceChannel === "WhatsApp" && "bg-success/10 text-success border-success/20"
                  )}>
                    Submitted via {s.sourceChannel}
                  </Badge>
                )}
              </div>
              <Badge variant="secondary" className={cn(
                "text-[10px]",
                effectiveType === "crowdsourced" && "bg-primary/10 text-primary/70 border-primary/15",
                effectiveType === "my-strategy" && "bg-accent text-accent-foreground border-accent/30"
              )}>
                {effectiveType === "crowdsourced" ? "Crowdsourced" : effectiveType === "my-strategy" ? "My Strategy" : "Vanilla LLM"}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>

            {s.sourceUrl && (
              <a
                href={s.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Source
              </a>
            )}

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                {statusIcon(s.validationStatus)}
                <span className="capitalize">{s.validationStatus}</span>
              </div>
              <div className="flex items-center gap-1">
                <Rocket className="h-3.5 w-3.5 text-primary" />
                <span className="capitalize">{s.deployStatus}</span>
              </div>
            </div>

            {s.deployStatus === "deployed" && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Return</p>
                  <p className={cn("text-sm font-mono font-semibold", s.returnPct >= 0 ? "text-success" : "text-destructive")}>
                    {s.returnPct >= 0 ? "+" : ""}{s.returnPct.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Sharpe</p>
                  <p className="text-sm font-mono font-semibold">{s.sharpe.toFixed(3)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Trades</p>
                  <p className="text-sm font-mono font-semibold">{s.trades}</p>
                </div>
              </div>
            )}
          </div>
            );
          })()
        ))}
      </div>
    </div>
  );
}
