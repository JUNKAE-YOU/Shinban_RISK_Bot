"use client";

import { format } from "date-fns";
import { useState } from "react";
import Sheet from "@/components/Sheet";
import type { BreastSide, Feeding, FeedType } from "@/lib/types";
import { AmountPicker, ChoiceGroup, SIDE_OPTIONS, TYPE_OPTIONS } from "./options";

export type FeedingDraft = {
  feed_type: FeedType;
  breast_side: BreastSide | null;
  started_at: string;
  ended_at: string;
  amount_ml: number | null;
  note: string | null;
};

const LOCAL_FMT = "yyyy-MM-dd'T'HH:mm";

/** 깜빡하고 못 누른 수유를 직접 추가하거나, 기존 기록을 수정하는 시트 */
export default function ManualFeedingSheet({
  initial,
  onClose,
  onSave,
}: {
  initial?: Feeding;
  onClose: () => void;
  onSave: (draft: FeedingDraft) => Promise<boolean>;
}) {
  const [type, setType] = useState<FeedType>(initial?.feed_type ?? "formula");
  const [side, setSide] = useState<BreastSide>(initial?.breast_side ?? "left");
  const [start, setStart] = useState(() =>
    format(initial ? new Date(initial.started_at) : new Date(Date.now() - 20 * 60_000), LOCAL_FMT),
  );
  const [minutes, setMinutes] = useState(() =>
    initial?.ended_at
      ? Math.round((new Date(initial.ended_at).getTime() - new Date(initial.started_at).getTime()) / 60_000)
      : 15,
  );
  const [amount, setAmount] = useState<number | null>(initial?.amount_ml ?? null);
  const [note, setNote] = useState(initial?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const startDate = new Date(start);
    if (Number.isNaN(startDate.getTime())) {
      setError("시작 시간을 확인해 주세요.");
      return;
    }
    if (startDate.getTime() > Date.now()) {
      setError("미래 시간은 기록할 수 없어요.");
      return;
    }
    setSaving(true);
    const ok = await onSave({
      feed_type: type,
      breast_side: type === "breast" ? side : null,
      started_at: startDate.toISOString(),
      ended_at: new Date(startDate.getTime() + Math.max(0, minutes) * 60_000).toISOString(),
      amount_ml: amount,
      note: note.trim() || null,
    });
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Sheet title={initial ? "수유 기록 수정" : "지난 수유 추가"} onClose={onClose}>
      <div className="space-y-4">
        <ChoiceGroup label="수유 종류" value={type} options={TYPE_OPTIONS} onChange={setType} />
        {type === "breast" && (
          <ChoiceGroup label="수유 방향" value={side} options={SIDE_OPTIONS} onChange={setSide} />
        )}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block font-semibold">시작 시간</span>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface-2 px-3 py-3 outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-semibold">수유 시간 (분)</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={180}
              value={minutes}
              onChange={(e) => setMinutes(Math.min(180, Math.max(0, Number(e.target.value) || 0)))}
              className="w-full rounded-xl border border-line bg-surface-2 px-3 py-3 outline-none focus:border-primary"
            />
          </label>
        </div>
        <div>
          <p className="mb-2 font-semibold">수유량 (ml)</p>
          <AmountPicker value={amount} onChange={setAmount} />
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          placeholder="메모 (선택)"
          className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-lg outline-none focus:border-primary"
        />
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        <button type="button" disabled={saving} onClick={save} className="btn w-full bg-primary py-5 text-xl text-white">
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
    </Sheet>
  );
}
