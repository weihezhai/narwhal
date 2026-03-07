import { NavLink as RouterNavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

interface TopNavLinkProps {
  to: string;
  children: React.ReactNode;
  end?: boolean;
}

export function TopNavLink({ to, children, end }: TopNavLinkProps) {
  return (
    <RouterNavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md",
          isActive
            ? "text-primary bg-primary/10"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        )
      }
    >
      {children}
    </RouterNavLink>
  );
}
