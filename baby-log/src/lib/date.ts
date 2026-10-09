import { format, formatDistanceStrict } from "date-fns";
import { ko } from "date-fns/locale";

/** 로컬 시간 기준 YYYY-MM-DD */
export const toDateKey = (d: Date) => format(d, "yyyy-MM-dd");

/** YYYY-MM-DD → 로컬 자정 Date */
export const fromDateKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const fmt = (d: Date | string, pattern: string) =>
  format(typeof d === "string" ? new Date(d) : d, pattern, { locale: ko });

/** 분 → "2시간 15분" */
export function formatMinutes(totalMin: number) {
  const m = Math.max(0, Math.round(totalMin));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}분`;
  return r === 0 ? `${h}시간` : `${h}시간 ${r}분`;
}

/** 초 → "12:05" 또는 "1:02:05" */
export function formatTimer(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}

export const ago = (iso: string, now: Date) =>
  formatDistanceStrict(new Date(iso), now, { locale: ko, addSuffix: true });
