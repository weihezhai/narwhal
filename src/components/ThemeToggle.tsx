import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="relative flex items-center w-14 h-7 rounded-full bg-secondary border border-border transition-colors duration-300 focus:outline-none"
      aria-label="Toggle theme"
    >
      <span
        className={`absolute flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground shadow-md transition-transform duration-300 ${
          dark ? "translate-x-1" : "translate-x-8"
        }`}
      >
        {dark ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
      </span>
      <span className="absolute left-1.5 flex items-center justify-center">
        {!dark && <Moon className="h-3 w-3 text-muted-foreground" />}
      </span>
      <span className="absolute right-1.5 flex items-center justify-center">
        {dark && <Sun className="h-3 w-3 text-muted-foreground" />}
      </span>
    </button>
  );
}
