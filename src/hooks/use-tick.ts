import { useState, useEffect, useRef } from "react";

/**
 * Hook that makes a number "tick" up and down slightly around its base value,
 * simulating live market data.
 * 
 * @param baseValue - The original value to fluctuate around
 * @param maxDriftPct - Maximum drift as a percentage of baseValue (default 0.3%)
 * @param intervalMs - Tick interval in ms (default 2000, randomized ±500)
 */
export function useTick(baseValue: number, maxDriftPct = 0.003, intervalMs = 2000): number {
  const [value, setValue] = useState(baseValue);
  const baseRef = useRef(baseValue);

  useEffect(() => {
    baseRef.current = baseValue;
  }, [baseValue]);

  useEffect(() => {
    const tick = () => {
      const base = baseRef.current;
      const maxDrift = Math.abs(base) * maxDriftPct;
      const drift = (Math.random() - 0.5) * 2 * maxDrift;
      setValue(base + drift);
    };

    // Initial small delay before first tick
    const initialTimeout = setTimeout(() => {
      tick();
      // Then set up interval with slight randomness
      const id = setInterval(tick, intervalMs + (Math.random() - 0.5) * 1000);
      intervalRef.current = id;
    }, Math.random() * 1500);

    const intervalRef = { current: null as ReturnType<typeof setInterval> | null };

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [maxDriftPct, intervalMs]);

  return value;
}

/**
 * Hook that returns an array of ticking values for batch usage.
 * Each value ticks independently with staggered timing.
 */
export function useTickBatch(baseValues: number[], maxDriftPct = 0.003, intervalMs = 2000): number[] {
  const [values, setValues] = useState<number[]>(baseValues);
  const basesRef = useRef(baseValues);

  useEffect(() => {
    basesRef.current = baseValues;
    setValues(baseValues);
  }, [baseValues.join(",")]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const intervals: ReturnType<typeof setInterval>[] = [];

    basesRef.current.forEach((_, idx) => {
      const delay = Math.random() * 2000;
      const timer = setTimeout(() => {
        const tick = () => {
          setValues(prev => {
            const next = [...prev];
            const base = basesRef.current[idx];
            if (base === undefined) return prev;
            const maxDrift = Math.abs(base) * maxDriftPct;
            const drift = (Math.random() - 0.5) * 2 * maxDrift;
            next[idx] = base + drift;
            return next;
          });
        };
        tick();
        const id = setInterval(tick, intervalMs + (Math.random() - 0.5) * 800);
        intervals.push(id);
      }, delay);
      timers.push(timer);
    });

    return () => {
      timers.forEach(clearTimeout);
      intervals.forEach(clearInterval);
    };
  }, [baseValues.length, maxDriftPct, intervalMs]);

  return values;
}
