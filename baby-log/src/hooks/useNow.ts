"use client";

import { useEffect, useState } from "react";

/** intervalMs 마다 갱신되는 현재 시각 (타이머/경과시간 표시용) */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
