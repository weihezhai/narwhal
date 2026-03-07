import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type MarketSession = "pre-market" | "regular" | "after-hours" | "overnight";

interface SessionConfig {
  label: string;
  dotClass: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  ping: boolean;
}

const SESSION_CONFIG: Record<MarketSession, SessionConfig> = {
  "pre-market": {
    label: "Pre-Market",
    dotClass: "bg-warning",
    bgClass: "bg-warning/10",
    borderClass: "border-warning/20",
    textClass: "text-warning",
    ping: false,
  },
  regular: {
    label: "Market Open",
    dotClass: "bg-success",
    bgClass: "bg-success/10",
    borderClass: "border-success/20",
    textClass: "text-success",
    ping: true,
  },
  "after-hours": {
    label: "After Hours",
    dotClass: "bg-primary",
    bgClass: "bg-primary/10",
    borderClass: "border-primary/20",
    textClass: "text-primary",
    ping: false,
  },
  overnight: {
    label: "Overnight",
    dotClass: "bg-muted-foreground",
    bgClass: "bg-muted-foreground/10",
    borderClass: "border-muted-foreground/20",
    textClass: "text-muted-foreground",
    ping: false,
  },
};

function getMarketSession(): MarketSession {
  const now = new Date();
  // Convert to ET (UTC-5 / UTC-4 DST)
  const et = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const h = et.getHours();
  const m = et.getMinutes();
  const day = et.getDay();
  const time = h * 60 + m;

  // Weekend → overnight
  if (day === 0 || day === 6) return "overnight";

  // Pre-market: 4:00 – 9:30 ET
  if (time >= 240 && time < 570) return "pre-market";
  // Regular: 9:30 – 16:00 ET
  if (time >= 570 && time < 960) return "regular";
  // After-hours: 16:00 – 20:00 ET
  if (time >= 960 && time < 1200) return "after-hours";
  // Overnight
  return "overnight";
}

export function TradingHoursIndicator() {
  const [session, setSession] = useState<MarketSession>(getMarketSession);

  useEffect(() => {
    const interval = setInterval(() => setSession(getMarketSession()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const config = SESSION_CONFIG[session];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono font-semibold",
        config.bgClass,
        config.borderClass,
        config.textClass
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {config.ping && (
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              config.dotClass
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex rounded-full h-1.5 w-1.5",
            config.dotClass,
            !config.ping && "animate-pulse"
          )}
        />
      </span>
      {config.label}
    </span>
  );
}
