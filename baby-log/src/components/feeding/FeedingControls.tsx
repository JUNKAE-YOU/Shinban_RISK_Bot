"use client";

import { useState } from "react";
import Sheet from "@/components/Sheet";
import { useNow } from "@/hooks/useNow";
import { fmt, formatTimer } from "@/lib/date";
import { FEED_TYPE_LABEL, SIDE_LABEL, type BreastSide, type Feeding, type FeedType } from "@/lib/types";
import { AmountPicker, ChoiceGroup, FEED_ICON, SIDE_OPTIONS, TYPE_OPTIONS } from "./options";

type Props = {
  active: Feeding | undefined;
  lastSide: BreastSide | null;
  onStart: (type: FeedType, side: BreastSide | null) => Promise<void>;
  onEnd: (id: string, endedAt: Date, amountMl: number | null, note: string | null) => Promise<boolean>;
  onCancel: (id: string) => Promise<void>;
};

export default function FeedingControls({ active, lastSide, onStart, onEnd, onCancel }: Props) {
  const [type, setType] = useState<FeedType>("breast");
  const [side, setSide] = useState<BreastSide>(lastSide === "left" ? "right" : "left");
  const [busy, setBusy] = useState(false);

  if (active) return <ActiveFeeding feeding={active} onEnd={onEnd} onCancel={onCancel} />;

  return (
    <section className="card space-y-4 p-4">
      <ChoiceGroup label="수유 종류" value={type} options={TYPE_OPTIONS} onChange={setType} />
      {type === "breast" && (
        <div className="space-y-1">
          <ChoiceGroup label="수유 방향" value={side} options={SIDE_OPTIONS} onChange={setSide} />
          {lastSide && (
            <p className="px-1 text-sm text-muted">지난번 직수: {SIDE_LABEL[lastSide]}</p>
          )}
        </div>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await onStart(type, type === "breast" ? side : null);
          setBusy(false);
        }}
        className="btn w-full bg-primary py-8 text-2xl text-white shadow-lg"
      >
        <span className="text-4xl" aria-hidden>
          ▶️
        </span>
        수유 시작
      </button>
    </section>
  );
}

function ActiveFeeding({
  feeding,
  onEnd,
  onCancel,
}: {
  feeding: Feeding;
  onEnd: Props["onEnd"];
  onCancel: Props["onCancel"];
}) {
  const now = useNow(1000);
  const [endedAt, setEndedAt] = useState<Date | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const elapsed = (now.getTime() - new Date(feeding.started_at).getTime()) / 1000;

  return (
    <section className="card space-y-4 border-2 border-primary p-5 text-center">
      <p className="text-lg font-semibold">
        {FEED_ICON[feeding.feed_type]} {FEED_TYPE_LABEL[feeding.feed_type]}
        {feeding.breast_side && ` · ${SIDE_LABEL[feeding.breast_side]}`} 수유 중
      </p>
      <p className="font-mono text-6xl font-extrabold tabular-nums" aria-live="off">
        {formatTimer(elapsed)}
      </p>
      <p className="text-muted">
        {fmt(feeding.started_at, "a h:mm")} 시작{feeding.author_name && ` · ${feeding.author_name}`}
      </p>
      <button
        type="button"
        onClick={() => {
          // 버튼을 누른 시각을 종료 시각으로 고정 (양 입력하는 동안 시간이 늘지 않도록)
          setEndedAt(new Date());
          setAmount(null);
          setNote("");
        }}
        className="btn w-full bg-danger py-8 text-2xl text-white shadow-lg"
      >
        <span className="text-4xl" aria-hidden>
          ⏹️
        </span>
        수유 종료
      </button>
      <button
        type="button"
        onClick={() => {
          if (confirm("진행 중인 수유 기록을 취소(삭제)할까요?")) void onCancel(feeding.id);
        }}
        className="text-sm text-muted underline"
      >
        잘못 눌렀어요 (기록 취소)
      </button>

      {endedAt && (
        <Sheet title="수유 종료" onClose={() => setEndedAt(null)}>
          <div className="space-y-4 text-left">
            <p className="text-muted">
              {fmt(feeding.started_at, "a h:mm")} ~ {fmt(endedAt, "a h:mm")} (
              {formatTimer((endedAt.getTime() - new Date(feeding.started_at).getTime()) / 1000)})
            </p>
            <div>
              <p className="mb-2 font-semibold">
                수유량 (ml){feeding.feed_type === "breast" && <span className="text-muted"> · 직수는 선택사항</span>}
              </p>
              <AmountPicker value={amount} onChange={setAmount} />
            </div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder="메모 (선택) 예: 트림 2번, 조금 게워냄"
              className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-lg outline-none focus:border-primary"
            />
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                const ok = await onEnd(feeding.id, endedAt, amount, note.trim() || null);
                setSaving(false);
                if (ok) setEndedAt(null);
              }}
              className="btn w-full bg-primary py-5 text-xl text-white"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </Sheet>
      )}
    </section>
  );
}
