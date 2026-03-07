import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { type Strategy } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, CheckCircle, Rocket, MessageCircle, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { listStrategies } from "@/lib/strategiesApi";

export default function StrategyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const payload = await listStrategies().catch(() => ({ strategies: [] }));
      const rows = payload?.strategies ?? [];
      if (!active) return;
      setStrategy(rows.find((s) => s.id === id) ?? null);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading strategy...</p>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Strategy not found.</p>
      </div>
    );
  }

  const s = strategy;
  const startNav = s.returnPct <= -99.99 ? 10000 : s.accountValue / (1 + s.returnPct / 100);
  const hwmPct = startNav > 0 ? (s.hwm / startNav - 1) * 100 : 0;
  const lookbackPeriod = "Recent 3 months (1min)";

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-1.5 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {/* Status Bar for messaging-sourced strategies */}
      {s.sourceChannel !== "Web" && (
        <div className={cn(
          "flex items-center gap-4 px-4 py-3 rounded-lg border text-sm",
          s.sourceChannel === "WhatsApp" ? "border-success/20 bg-success/5" : "border-primary/20 bg-primary/5"
        )}>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4" />
            <span className="font-medium">Submitted via {s.sourceChannel}</span>
          </div>
          <span className="text-muted-foreground">•</span>
          <div className="flex items-center gap-1.5">
            {s.stage === "Backtest Running" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            ) : s.stage === "Deployed" || s.stage === "Rank Updated" ? (
              <CheckCircle className="h-3.5 w-3.5 text-success" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-warning" />
            )}
            <span>Stage: {s.stage || "Deployed"}</span>
          </div>
          {s.stage === "Backtest Running" && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground font-mono">ETA ~2 min</span>
            </>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">{s.name}</h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">by {s.creator} • Created {s.createdAt}</p>
            {s.sourceChannel !== "Web" && (
              <Badge variant="secondary" className={cn(
                "text-[10px]",
                s.sourceChannel === "WhatsApp" && "bg-success/10 text-success border-success/20"
              )}>
                Submitted via {s.sourceChannel}
              </Badge>
            )}
          </div>
        </div>
        <Badge variant="secondary" className={cn(
          s.type === "crowdsourced" && "bg-primary/10 text-primary/70 border-primary/15",
          s.type === "my-strategy" && "bg-accent text-accent-foreground border-accent/30"
        )}>
          {s.type === "crowdsourced" ? "Crowdsourced" : s.type === "my-strategy" ? "My Strategy" : "Vanilla LLM"}
        </Badge>
      </div>

      <p className="text-muted-foreground">{s.description}</p>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Account Value", value: `$${s.accountValue.toLocaleString()}` },
          { label: "Return", value: `${s.returnPct >= 0 ? "+" : ""}${s.returnPct.toFixed(2)}%`, color: s.returnPct >= 0 },
          { label: "Sharpe Ratio", value: s.sharpe.toFixed(3) },
          { label: "Win Rate", value: `${s.winRate.toFixed(1)}%` },
          { label: "Total P&L", value: `$${s.totalPnL.toLocaleString()}`, color: s.totalPnL >= 0 },
          { label: "Fees", value: `$${s.fees.toFixed(1)}` },
          { label: "HWM", value: `$${s.hwm.toLocaleString()}` },
          { label: "Max Drawdown", value: `${s.maxDrawdown.toFixed(1)}%`, color: false },
        ].map((m) => (
          <div key={m.label} className="glass-panel p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
            <p className={cn("text-lg font-mono font-bold mt-1", m.color === true && "text-success", m.color === false && "text-destructive")}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Skill Profile */}
      {s.skillProfile && (
        <div className="glass-panel p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gradient">Skill Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <ProfileSection title="Indicators" items={s.skillProfile.indicators} />
            <ProfileSection title="Entry Conditions" items={s.skillProfile.entryConditions} />
            <ProfileSection title="Exit Conditions" items={s.skillProfile.exitConditions} />
            <div>
              <p className="text-xs uppercase text-muted-foreground mb-1">Risk Management</p>
              <p className="font-mono text-xs">{s.skillProfile.riskManagement}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground mb-1">Position Sizing</p>
              <p className="font-mono text-xs">{s.skillProfile.positionSizing}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground mb-1">Timeframe</p>
              <p className="font-mono text-xs">{s.skillProfile.timeframe}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground mb-1">Source</p>
              <p className="font-mono text-xs">{s.skillProfile.source}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground mb-1">Version</p>
              <p className="font-mono text-xs">{s.skillProfile.version}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary & Trade Summary for My Strategy */}
      {s.type === "my-strategy" && (
        <>
          {/* Summary Table */}
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gradient">Summary</h2>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Start NAV</TableHead>
                    <TableHead>End NAV</TableHead>
                    <TableHead>Return %</TableHead>
                    <TableHead>Win Rate</TableHead>
                    <TableHead>HWM (%)</TableHead>
                    <TableHead>Max Drawdown</TableHead>
                    <TableHead>Trades</TableHead>
                    <TableHead>Lookback Period</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono">{startNav.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="font-mono">{s.accountValue.toLocaleString()}</TableCell>
                    <TableCell className={cn("font-mono", s.returnPct >= 0 ? "text-success" : "text-destructive")}>
                      {s.returnPct.toFixed(2)}%
                    </TableCell>
                    <TableCell className="font-mono">{s.winRate.toFixed(1)}%</TableCell>
                    <TableCell className="font-mono">{hwmPct.toFixed(2)}%</TableCell>
                    <TableCell className={cn("font-mono", "text-destructive")}>{s.maxDrawdown.toFixed(2)}%</TableCell>
                    <TableCell className="font-mono">{s.trades}</TableCell>
                    <TableCell className="font-mono text-xs">{lookbackPeriod}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Trade Summary Table */}
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gradient">Trade Summary</h2>
            <div className="rounded-lg border border-border/50 bg-secondary/20 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Trade-level details are not available in this view yet. Summary metrics above are computed from stored strategy performance data.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProfileSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground mb-1">{title}</p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item} className="font-mono text-xs flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-primary" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
