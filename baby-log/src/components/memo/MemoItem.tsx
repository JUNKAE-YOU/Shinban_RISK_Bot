"use client";

import { useState } from "react";
import { fmt } from "@/lib/date";
import type { Memo } from "@/lib/types";
import MemoComposer from "./MemoComposer";

type Props = {
  memo: Memo;
  onUpdate: (id: string, content: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
};

export default function MemoItem({ memo, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="card p-4">
        <MemoComposer
          initial={memo.content}
          submitLabel="수정 완료"
          onCancel={() => setEditing(false)}
          onSubmit={async (text) => {
            const ok = await onUpdate(memo.id, text);
            if (ok) setEditing(false);
            return ok;
          }}
        />
      </li>
    );
  }

  return (
    <li className="card p-4">
      <div className="mb-2 flex items-center justify-between text-sm text-muted">
        <span>
          <b className="text-foreground">{fmt(memo.created_at, "a h:mm")}</b>
          {memo.author_name && <> · {memo.author_name}</>}
          {memo.updated_at !== memo.created_at && " · 수정됨"}
        </span>
        <span className="flex gap-1">
          <button type="button" onClick={() => setEditing(true)} className="btn px-3 py-2 text-sm">
            ✏️ 수정
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm("이 메모를 삭제할까요?")) void onDelete(memo.id);
            }}
            className="btn px-3 py-2 text-sm text-danger"
          >
            🗑️ 삭제
          </button>
        </span>
      </div>
      <p className="whitespace-pre-wrap break-words text-lg leading-relaxed">{memo.content}</p>
    </li>
  );
}
