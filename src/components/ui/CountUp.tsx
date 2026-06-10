"use client";

import { useEffect, useState } from "react";

interface CountUpProps {
  to: number;
  suffix?: string;
  decimals?: number;
  delay?: number;
}

export default function CountUp({
  to,
  suffix = "",
  decimals = 0,
  delay = 400,
}: CountUpProps) {
  const [display, setDisplay] = useState(decimals ? "0,0" : "0");

  useEffect(() => {
    const timer = setTimeout(() => {
      const start = performance.now();
      const dur = 900;

      function step(now: number) {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = to * eased;
        setDisplay(
          decimals
            ? v.toFixed(decimals).replace(".", ",")
            : Math.round(v).toString()
        );
        if (p < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    }, delay);

    return () => clearTimeout(timer);
  }, [to, decimals, delay]);

  return (
    <>
      {display}
      {suffix}
    </>
  );
}
