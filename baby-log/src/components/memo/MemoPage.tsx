"use client";

import { startOfMonth } from "date-fns";
import { useMemo, useState } from "react";
import Loading from "@/components/Loading";
import { useHydrated } from "@/hooks/useHydrated";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { fmt, fromDateKey, toDateKey } from "@/lib/date";
import { getSupabase } from "@/lib/supabase/client";
import type { Memo } from "@/lib/types";
import MemoComposer from "./MemoComposer";
import MemoItem from "./MemoItem";
import MonthCalendar, { calendarRange } from "./MonthCalendar";

export default function MemoPage() {
  // 날짜 계산은 브라우저(사용자 시간대) 기준으로만 수행
  const hydrated = useHydrated();
  if (!hydrated) return <Loading />;
  return <MemoPageInner />;
}

function MemoPageInner() {
  const supabase = getSupabase();
  const today = toDateKey(new Date());
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [view, setView] = useState<"calendar" | "timeline">("calendar");
  const [actionError, setActionError] = useState<string | null>(null);

  const { from, to } = calendarRange(month);
  const fromKey = toDateKey(from);
  const toKey = toDateKey(to);

  const { data: memos, loading, error, refetch } = useRealtimeQuery<Memo>(
    "memos",
    () =>
      supabase
        .from("memos")
        .select("*")
        .gte("memo_date", fromKey)
        .lte("memo_date", toKey)
        .order("memo_date", { ascending: false })
        .order("created_at", { ascending: true }),
    `${fromKey}_${toKey}`,
  );

  const byDate = useMemo(() => {
    const map = new Map<string, Memo[]>();
    for (const m of memos) {
      const list = map.get(m.memo_date) ?? [];
      list.push(m);
      map.set(m.memo_date, list);
    }
    return map;
  }, [memos]);

  const counts = useMemo(
    () => new Map([...byDate].map(([k, v]) => [k, v.length] as const)),
    [byDate],
  );

  async function addMemo(content: string) {
    setActionError(null);
    const { error } = await supabase.from("memos").insert({ memo_date: selected, content });
    if (error) {
      setActionError(`저장 실패: ${error.message}`);
      return false;
    }
    await refetch();
    return true;
  }

  async function updateMemo(id: string, content: string) {
    setActionError(null);
    const { error } = await supabase.from("memos").update({ content }).eq("id", id);
    if (error) {
      setActionError(`수정 실패: ${error.message}`);
      return false;
    }
    await refetch();
    return true;
  }

  async function deleteMemo(id: string) {
    setActionError(null);
    const { error } = await supabase.from("memos").delete().eq("id", id);
    if (error) setActionError(`삭제 실패: ${error.message}`);
    await refetch();
  }

  function selectDate(key: string) {
    setSelected(key);
    const m = startOfMonth(fromDateKey(key));
    if (m.getTime() !== month.getTime()) setMonth(m);
  }

  const selectedMemos = byDate.get(selected) ?? [];
  const selectedDate = fromDateKey(selected);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface-2 p-1" role="tablist">
        {(["calendar", "timeline"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`btn py-3 text-base ${view === v ? "bg-surface shadow-sm" : "text-muted"}`}
          >
            {v === "calendar" ? "📅 캘린더" : "🕒 타임라인"}
          </button>
        ))}
      </div>

      {(error || actionError) && (
        <p role="alert" className="rounded-xl bg-primary-soft px-4 py-3 text-danger">
          {actionError ?? `불러오기 실패: ${error}`}
        </p>
      )}

      {view === "calendar" ? (
        <>
          <MonthCalendar
            month={month}
            selected={selected}
            today={today}
            counts={counts}
            onSelect={selectDate}
            onMonthChange={setMonth}
          />

          <section className="card space-y-3 p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-extrabold">{fmt(selectedDate, "M월 d일 (EEE)")}</h2>
              {selected !== today && (
                <button type="button" onClick={() => selectDate(today)} className="text-sm text-primary underline">
                  오늘로
                </button>
              )}
            </div>
            <MemoComposer key={selected} onSubmit={addMemo} />
          </section>

          {loading ? (
            <Loading />
          ) : selectedMemos.length === 0 ? (
            <p className="py-8 text-center text-muted">이 날의 기록이 아직 없어요.</p>
          ) : (
            <ul className="space-y-3">
              {selectedMemos.map((m) => (
                <MemoItem key={m.id} memo={m} onUpdate={updateMemo} onDelete={deleteMemo} />
              ))}
            </ul>
          )}
        </>
      ) : (
        <Timeline
          month={month}
          onMonthChange={setMonth}
          loading={loading}
          byDate={byDate}
          onUpdate={updateMemo}
          onDelete={deleteMemo}
        />
      )}
    </div>
  );
}

function Timeline({
  month,
  onMonthChange,
  loading,
  byDate,
  onUpdate,
  onDelete,
}: {
  month: Date;
  onMonthChange: (m: Date) => void;
  loading: boolean;
  byDate: Map<string, Memo[]>;
  onUpdate: (id: string, content: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
}) {
  const monthKey = fmt(month, "yyyy-MM");
  // 달력 범위에는 앞뒤 달 일부가 섞여 있으므로 해당 월만 표시
  const days = [...byDate.keys()].filter((k) => k.startsWith(monthKey));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(startOfMonth(new Date(month.getFullYear(), month.getMonth() - 1)))}
          className="btn h-12 w-12 text-2xl"
          aria-label="이전 달"
        >
          ‹
        </button>
        <h2 className="text-lg font-bold">{fmt(month, "yyyy년 M월")} 기록</h2>
        <button
          type="button"
          onClick={() => onMonthChange(startOfMonth(new Date(month.getFullYear(), month.getMonth() + 1)))}
          className="btn h-12 w-12 text-2xl"
          aria-label="다음 달"
        >
          ›
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : days.length === 0 ? (
        <p className="py-8 text-center text-muted">이 달의 기록이 아직 없어요.</p>
      ) : (
        <ol className="relative space-y-6 border-l-2 border-primary-soft pl-5">
          {days.map((day) => (
            <li key={day}>
              <span className="absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full border-2 border-surface bg-primary" />
              <h3 className="mb-2 text-lg font-extrabold">{fmt(fromDateKey(day), "M월 d일 (EEE)")}</h3>
              <ul className="space-y-3">
                {byDate.get(day)!.map((m) => (
                  <MemoItem key={m.id} memo={m} onUpdate={onUpdate} onDelete={onDelete} />
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
