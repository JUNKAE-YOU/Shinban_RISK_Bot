"use client";

import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fmt, toDateKey } from "@/lib/date";

type Props = {
  month: Date;
  selected: string;
  today: string;
  counts: Map<string, number>;
  onSelect: (key: string) => void;
  onMonthChange: (month: Date) => void;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function calendarRange(month: Date) {
  return {
    from: startOfWeek(startOfMonth(month)),
    to: endOfWeek(endOfMonth(month)),
  };
}

export default function MonthCalendar({ month, selected, today, counts, onSelect, onMonthChange }: Props) {
  const { from, to } = calendarRange(month);
  const days: Date[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);

  return (
    <section className="card p-3" aria-label="달력">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, -1))}
          className="btn h-12 w-12 text-2xl"
          aria-label="이전 달"
        >
          ‹
        </button>
        <h2 className="text-lg font-bold">{fmt(month, "yyyy년 M월")}</h2>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, 1))}
          className="btn h-12 w-12 text-2xl"
          aria-label="다음 달"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-semibold text-muted">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`py-1 ${i === 0 ? "text-danger" : ""}`}>
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = toDateKey(d);
          const count = counts.get(key) ?? 0;
          const isSelected = key === selected;
          const isToday = key === today;
          const inMonth = isSameMonth(d, month);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-pressed={isSelected}
              aria-label={`${fmt(d, "M월 d일")}${count ? `, 메모 ${count}개` : ""}`}
              className={`flex h-12 flex-col items-center justify-center rounded-xl text-base transition-colors ${
                isSelected
                  ? "bg-primary font-bold text-white"
                  : isToday
                    ? "bg-primary-soft font-bold"
                    : "hover:bg-surface-2"
              } ${inMonth ? "" : "opacity-40"}`}
            >
              {d.getDate()}
              <span
                className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                  count ? (isSelected ? "bg-white" : "bg-primary") : "bg-transparent"
                }`}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
