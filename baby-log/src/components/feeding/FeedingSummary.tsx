"use client";

import { useNow } from "@/hooks/useNow";
import { formatMinutes } from "@/lib/date";
import type { Feeding } from "@/lib/types";
import type { DaySummary } from "./stats";

/** 오늘 한눈에 보기: 마지막 수유 경과, 오늘 횟수/총량/평균 간격 */
export default function FeedingSummary({ latest, today }: { latest: Feeding | undefined; today: DaySummary }) {
  const now = useNow(30_000);
  const sinceLast = latest ? (now.getTime() - new Date(latest.started_at).getTime()) / 60_000 : null;

  const tiles = [
    { label: "오늘 수유", value: `${today.count}회` },
    { label: "오늘 총량", value: `${today.totalMl}ml` },
    { label: "평균 간격", value: today.avgIntervalMin === null ? "-" : formatMinutes(today.avgIntervalMin) },
  ];

  return (
    <section className="space-y-3" aria-label="오늘 요약">
      <div className="card flex items-baseline justify-between p-4">
        <p className="text-muted">마지막 수유 시작 후</p>
        <p className="text-3xl font-extrabold tabular-nums">
          {sinceLast === null ? "-" : formatMinutes(sinceLast)}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="card p-3">
            <p className="text-sm text-muted">{t.label}</p>
            <p className="text-lg font-extrabold leading-tight tabular-nums break-keep sm:text-xl">{t.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
