"use client";

import { useState } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import MicButton from "./MicButton";

type Props = {
  initial?: string;
  submitLabel?: string;
  placeholder?: string;
  /** 저장 성공 시 true 반환 → 입력창 비움 */
  onSubmit: (text: string) => Promise<boolean>;
  onCancel?: () => void;
};

export default function MemoComposer({
  initial = "",
  submitLabel = "저장",
  placeholder = "오늘 아기는 어땠나요? 🎤 버튼을 누르고 말해도 돼요.",
  onSubmit,
  onCancel,
}: Props) {
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);

  const stt = useSpeechRecognition({
    onFinal: (t) => setText((prev) => (prev.trim() ? `${prev.trimEnd()} ${t}` : t)),
  });

  async function submit() {
    const value = text.trim();
    if (!value) return;
    stt.stop();
    setSaving(true);
    const ok = await onSubmit(value);
    setSaving(false);
    if (ok && !onCancel) setText("");
  }

  return (
    <div className="space-y-3">
      <MicButton listening={stt.listening} supported={stt.supported} onClick={stt.toggle} />

      {stt.error && (
        <p role="alert" className="rounded-xl bg-primary-soft px-4 py-3 text-sm text-danger">
          {stt.error}
        </p>
      )}

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={4}
          maxLength={5000}
          className="w-full resize-y rounded-2xl border border-line bg-surface-2 px-4 py-3 text-lg leading-relaxed outline-none focus:border-primary"
        />
        {stt.interim && (
          <p className="mt-1 px-1 text-muted italic" aria-live="polite">
            {stt.interim}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn flex-1 border border-line bg-surface py-4 text-lg">
            취소
          </button>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={saving || !text.trim()}
          className="btn flex-[2] bg-primary py-4 text-lg text-white"
        >
          {saving ? "저장 중…" : submitLabel}
        </button>
      </div>
    </div>
  );
}
