import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TickingNumberProps {
  value: number;
  format: (v: number) => string;
  className?: string;
}

/**
 * A number that only flashes when the actual value changes
 * (green up, red down). No synthetic/random drift.
 */
export function TickingNumber({
  value,
  format,
  className,
}: TickingNumberProps) {
  const [display, setDisplay] = useState(value);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const prev = prevValueRef.current;
    if (value !== prev) {
      const direction = value > prev ? "up" : "down";
      setFlash(direction);
      const timeoutId = setTimeout(() => setFlash(null), 400);
      prevValueRef.current = value;
      setDisplay(value);
      return () => clearTimeout(timeoutId);
    }
    setDisplay(value);
  }, [value]);

  return (
    <span
      className={cn(
        "transition-colors duration-300",
        flash === "up" && "!text-success",
        flash === "down" && "!text-destructive",
        className
      )}
    >
      {format(display)}
    </span>
  );
}
