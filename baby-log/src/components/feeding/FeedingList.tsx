"use client";

import { fmt, formatMinutes, toDateKey, fromDateKey } from "@/lib/date";
import { FEED_TYPE_LABEL, SIDE_LABEL, type Feeding } from "@/lib/types";
import { FEED_ICON } from "./options";
import { intervalsById } from "./stats";

type Props = {
  feedings: Feeding[]; // 최신순
  onEdit: (f: Feeding) => void;
  onDelete: (id: string) => Promise<void>;
};

export default function FeedingList({ feedings, onEdit, onDelete }: Props) {
  const intervals = intervalsById(feedings);
  const groups = new Map<string, Feeding[]>();
  for (const f of feedings) {
    const key = toDateKey(new Date(f.started_at));
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }

  if (feedings.length === 0) {
    return <p className="py-8 text-center text-muted">아직 수유 기록이 없어요.</p>;
  }

  return (
    <section className="space-y-5">
      {[...groups].map(([day, items]) => (
        <div key={day}>
          <h3 className="mb-2 flex items-baseline justify-between px-1">
            <span className="text-lg font-extrabold">{fmt(fromDateKey(day), "M월 d일 (EEE)")}</span>
            <span className="text-sm text-muted">
              {items.length}회 · {items.reduce((s, f) => s + (f.amount_ml ?? 0), 0)}ml
            </span>
          </h3>
          <ul className="space-y-2">
            {items.map((f) => {
              const gap = intervals.get(f.id);
              const duration = f.ended_at
                ? (new Date(f.ended_at).getTime() - new Date(f.started_at).getTime()) / 60_000
                : null;
              return (
                <li key={f.id} className="card flex items-center gap-3 p-3">
                  <span className="text-3xl" aria-hidden>
                    {FEED_ICON[f.feed_type]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">
                      {fmt(f.started_at, "a h:mm")}
                      {f.ended_at ? ` ~ ${fmt(f.ended_at, "h:mm")}` : " ~ 진행 중"}
                      {f.amount_ml !== null && <span className="ml-2 text-primary">{f.amount_ml}ml</span>}
                    </p>
                    <p className="text-sm break-keep text-muted">
                      {FEED_TYPE_LABEL[f.feed_type]}
                      {f.breast_side && ` · ${SIDE_LABEL[f.breast_side]}`}
                      {duration !== null && ` · ${formatMinutes(duration)}`}
                      {gap !== undefined && ` · 간격 ${formatMinutes(gap)}`}
                      {f.author_name && ` · ${f.author_name}`}
                    </p>
                    {f.note && <p className="mt-1 text-sm">{f.note}</p>}
                  </div>
                  {f.ended_at && (
                    <div className="flex shrink-0 flex-col gap-1">
                      <button type="button" onClick={() => onEdit(f)} className="btn px-2 py-1 text-sm" aria-label="수정">
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("이 수유 기록을 삭제할까요?")) void onDelete(f.id);
                        }}
                        className="btn px-2 py-1 text-sm"
                        aria-label="삭제"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
