"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmt, formatMinutes } from "@/lib/date";
import type { DaySummary } from "./stats";

type Row = DaySummary & { label: string };

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-md">
      <p className="font-bold">{fmt(d.date, "M월 d일 (EEE)")}</p>
      <p>총량 {d.totalMl}ml</p>
      <p className="text-muted">{d.count}회 수유</p>
    </div>
  );
}

/** 최근 7일 일별 수유 총량 차트 + 같은 내용의 표 (색에만 의존하지 않도록) */
export default function FeedingChart({ days }: { days: DaySummary[] }) {
  const rows: Row[] = days.map((d) => ({ ...d, label: fmt(d.date, "M/d") }));

  return (
    <section className="card space-y-3 p-4">
      <h2 className="text-lg font-extrabold">최근 7일 수유 총량 (ml)</h2>
      <div className="h-56" role="img" aria-label="최근 7일 일별 수유 총량 막대 차트">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-2)" }} />
            <Bar dataKey="totalMl" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <details>
        <summary className="cursor-pointer py-2 font-semibold text-muted">날짜별 표로 보기</summary>
        <table className="w-full text-left text-sm tabular-nums">
          <thead className="text-muted">
            <tr>
              <th className="py-1 font-semibold">날짜</th>
              <th className="py-1 text-right font-semibold">횟수</th>
              <th className="py-1 text-right font-semibold">총량</th>
              <th className="py-1 text-right font-semibold">평균 간격</th>
            </tr>
          </thead>
          <tbody>
            {[...rows].reverse().map((d) => (
              <tr key={d.key} className="border-t border-line">
                <td className="py-2">{fmt(d.date, "M/d (EEE)")}</td>
                <td className="py-2 text-right">{d.count}회</td>
                <td className="py-2 text-right">{d.totalMl}ml</td>
                <td className="py-2 text-right">{d.avgIntervalMin === null ? "-" : formatMinutes(d.avgIntervalMin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
