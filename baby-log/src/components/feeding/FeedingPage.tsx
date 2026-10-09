"use client";

import { addDays, startOfDay } from "date-fns";
import { useState } from "react";
import Loading from "@/components/Loading";
import { useHydrated } from "@/hooks/useHydrated";
import { useNow } from "@/hooks/useNow";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { toDateKey } from "@/lib/date";
import { getSupabase } from "@/lib/supabase/client";
import type { BreastSide, Feeding, FeedType } from "@/lib/types";
import FeedingChart from "./FeedingChart";
import FeedingControls from "./FeedingControls";
import FeedingList from "./FeedingList";
import FeedingSummary from "./FeedingSummary";
import ManualFeedingSheet, { type FeedingDraft } from "./ManualFeedingSheet";
import { summarizeDays } from "./stats";

const DAYS = 7;

export default function FeedingPage() {
  const hydrated = useHydrated();
  if (!hydrated) return <Loading />;
  return <FeedingPageInner />;
}

function FeedingPageInner() {
  const supabase = getSupabase();
  const now = useNow(60_000);
  const since = startOfDay(addDays(now, -(DAYS - 1)));
  const sinceKey = toDateKey(since);

  const [sheet, setSheet] = useState<{ mode: "add" } | { mode: "edit"; feeding: Feeding } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: feedings, loading, error, refetch } = useRealtimeQuery<Feeding>(
    "feedings",
    () =>
      supabase
        .from("feedings")
        .select("*")
        // 최근 7일 + (혹시 오래 켜져 있는) 진행 중 수유
        .or(`started_at.gte."${since.toISOString()}",ended_at.is.null`)
        .order("started_at", { ascending: false }),
    sinceKey,
  );

  const active = feedings.find((f) => !f.ended_at);
  const lastSide = feedings.find((f) => f.feed_type === "breast" && f.breast_side)?.breast_side ?? null;
  const days = summarizeDays(feedings, now, DAYS);

  async function run(op: PromiseLike<{ error: { message: string } | null }>, label: string) {
    setActionError(null);
    const { error } = await op;
    if (error) setActionError(`${label} 실패: ${error.message}`);
    await refetch();
    return !error;
  }

  const start = (feed_type: FeedType, breast_side: BreastSide | null) =>
    run(supabase.from("feedings").insert({ feed_type, breast_side, started_at: new Date().toISOString() }), "수유 시작").then(
      () => undefined,
    );

  const end = (id: string, endedAt: Date, amount_ml: number | null, note: string | null) =>
    run(
      supabase.from("feedings").update({ ended_at: endedAt.toISOString(), amount_ml, note }).eq("id", id),
      "수유 종료",
    );

  const remove = (id: string) => run(supabase.from("feedings").delete().eq("id", id), "삭제").then(() => undefined);

  const saveDraft = (draft: FeedingDraft) =>
    sheet?.mode === "edit"
      ? run(supabase.from("feedings").update(draft).eq("id", sheet.feeding.id), "수정")
      : run(supabase.from("feedings").insert(draft), "추가");

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      {(error || actionError) && (
        <p role="alert" className="rounded-xl bg-primary-soft px-4 py-3 text-danger">
          {actionError ?? `불러오기 실패: ${error}`}
        </p>
      )}

      <FeedingControls active={active} lastSide={lastSide} onStart={start} onEnd={end} onCancel={remove} />

      <button
        type="button"
        onClick={() => setSheet({ mode: "add" })}
        className="btn w-full border-2 border-dashed border-line py-4 text-lg text-muted"
      >
        ＋ 지난 수유 직접 추가
      </button>

      <FeedingSummary latest={feedings[0]} today={days[days.length - 1]} />
      <FeedingChart days={days} />
      <FeedingList feedings={feedings} onEdit={(f) => setSheet({ mode: "edit", feeding: f })} onDelete={remove} />

      {sheet && (
        <ManualFeedingSheet
          key={sheet.mode === "edit" ? sheet.feeding.id : "new"}
          initial={sheet.mode === "edit" ? sheet.feeding : undefined}
          onClose={() => setSheet(null)}
          onSave={saveDraft}
        />
      )}
    </div>
  );
}
