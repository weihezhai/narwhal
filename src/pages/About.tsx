import { Badge } from "@/components/ui/badge";
import { Zap, GitBranch, BarChart3, Bot, Globe, Shield } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Alpha Extraction",
    description: "Extract trading logic from public sources — blogs, Reddit, Substack, research papers.",
  },
  {
    icon: GitBranch,
    title: "Standardized Skills",
    description: "Package strategies into versioned Agent Skills with indicators, entry/exit conditions, and risk rules.",
  },
  {
    icon: BarChart3,
    title: "Fair Benchmarking",
    description: "Every strategy runs with the same $10K capital, fee structure, and time period. No cherry-picking.",
  },
  {
    icon: Bot,
    title: "Vanilla LLM Baselines",
    description: "GPT-5, Gemini, Claude run as baselines. Beat the machines to prove your alpha.",
  },
  {
    icon: Globe,
    title: "Open Leaderboard",
    description: "Transparent, real-time ranking of all strategies. Crowdsourced vs. vanilla — let the data speak.",
  },
  {
    icon: Shield,
    title: "Validation Pipeline",
    description: "AI-assisted validation ensures every submission has complete entry, exit, and risk management rules.",
  },
];

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-16 animate-fade-in">
      {/* Hero */}
      <div className="space-y-4 text-center pt-8">
        <img
          src="/lovable-uploads/1127c3dc-21d1-4bbc-bf04-1ccb513645a8.png"
          alt="TradingNarwhal"
          className="h-24 w-24 mx-auto"
        />
        <Badge variant="secondary" className="font-mono text-xs">
          Alpha Infrastructure Platform
        </Badge>
        <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
          <span className="text-gradient">Strategic Trading</span>
          <br />
          Everyone, Everyday, Everywhere
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          TradingNarwhal extracts trading logic from public sources, packages it into standardized skills,
          backtests under unified conditions, and ranks against vanilla LLM baselines.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f) => (
          <div key={f.title} className="glass-panel-hover p-6 space-y-3">
            <f.icon className="h-6 w-6 text-primary" />
            <h3 className="font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.description}</p>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">How It Works</h2>
        <div className="flex flex-col md:flex-row gap-4">
          {[
            { step: "01", title: "Submit", desc: "Paste a URL or upload a document with trading logic." },
            { step: "02", title: "Extract", desc: "AI reads the content and generates a structured strategy profile." },
            { step: "03", title: "Validate", desc: "The system checks for complete entry, exit, and risk rules." },
            { step: "04", title: "Backtest", desc: "$10K capital, fixed fees, Jan–Mar 2026. Fair and standardized." },
            { step: "05", title: "Rank", desc: "Results auto-push to the Global Leaderboard." },
          ].map((s) => (
            <div key={s.step} className="glass-panel p-5 flex-1 space-y-2">
              <span className="text-xs font-mono text-primary font-bold">{s.step}</span>
              <h4 className="font-semibold">{s.title}</h4>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
