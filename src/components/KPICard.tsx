import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  label: string;
  className?: string;
}

export function KPICard({ title, value, label, className }: KPICardProps) {
  return (
    <div className={cn("glass-panel p-6 space-y-2", className)}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <p className="text-3xl font-bold font-mono glow-text">{value}</p>
      <p className="text-sm text-foreground/60 font-medium">{label}</p>
    </div>
  );
}
