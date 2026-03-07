import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";
import logo from "@/assets/logo.svg";
import { Trophy, Layers, Upload, Link, Info } from "lucide-react";
import { useMemo } from "react";

const NAV_TABS = [
  { title: "Leaderboard", icon: Trophy, path: "/" },
  { title: "Strategies", icon: Layers, path: "/strategies" },
  { title: "Submit", icon: Upload, path: "/submit" },
  { title: "Integrations", icon: Link, path: "/integrations" },
  { title: "About", icon: Info, path: "/about" },
] as const;

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeIndex = useMemo(() => {
    const idx = NAV_TABS.findIndex((t) => {
      if (t.path === "/") return location.pathname === "/";
      return location.pathname.startsWith(t.path);
    });
    return idx >= 0 ? idx : null;
  }, [location.pathname]);

  const handleTabChange = (index: number | null) => {
    if (index !== null && NAV_TABS[index]) {
      navigate(NAV_TABS[index].path);
    }
  };

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      {/* Ambient gradient glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 rounded-full bg-primary/8 blur-[180px]" />
        <div className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 rounded-full bg-primary/6 blur-[180px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 rounded-full bg-background/80 blur-[200px]" />
      </div>

      {/* Top Navigation — transparent, no border */}
      <header className="sticky top-0 z-50 relative">
        <div className="container flex h-16 items-center relative">
          <div className="flex items-center gap-2">
            <img alt="TradingNarwhal" className="h-8 w-8" src="/lovable-uploads/1127c3dc-21d1-4bbc-bf04-1ccb513645a8.png" />
            <span className="text-xl font-bold text-gradient font-mono tracking-tighter">
               TradingNarwhal
            </span>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2">
            <ExpandableTabs
              tabs={NAV_TABS.map((t) => ({ title: t.title, icon: t.icon }))}
              activeIndex={activeIndex}
              onChange={handleTabChange}
            />
          </div>

          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground font-mono">
        TradingNarwhal © 2026 — Crowdsourced Alpha for AI Agents
      </footer>
    </div>
  );
}
