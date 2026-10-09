import { addDays, startOfDay } from "date-fns";
import { toDateKey } from "@/lib/date";
import type { Feeding } from "@/lib/types";

export type DaySummary = {
  key: string;
  date: Date;
  count: number;
  totalMl: number;
  avgIntervalMin: number | null;
};

const startMs = (f: Feeding) => new Date(f.started_at).getTime();

/** 각 수유의 '직전 수유 시작'으로부터의 간격(분). feedings 는 최신순 정렬 가정 */
export function intervalsById(feedings: Feeding[]) {
  const map = new Map<string, number>();
  for (let i = 0; i < feedings.length - 1; i++) {
    map.set(feedings[i].id, (startMs(feedings[i]) - startMs(feedings[i + 1])) / 60_000);
  }
  return map;
}

/** 최근 n일의 날짜별 요약 (오래된 날 → 최근 날 순) */
export function summarizeDays(feedings: Feeding[], now: Date, days = 7): DaySummary[] {
  const intervals = intervalsById(feedings);
  const first = startOfDay(addDays(now, -(days - 1)));
  const result: DaySummary[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(first, i);
    const key = toDateKey(date);
    const items = feedings.filter((f) => toDateKey(new Date(f.started_at)) === key);
    const gaps = items.map((f) => intervals.get(f.id)).filter((v): v is number => v !== undefined);
    result.push({
      key,
      date,
      count: items.length,
      totalMl: items.reduce((sum, f) => sum + (f.amount_ml ?? 0), 0),
      avgIntervalMin: gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null,
    });
  }
  return result;
}
