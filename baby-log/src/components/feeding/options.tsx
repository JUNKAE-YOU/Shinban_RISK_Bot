"use client";

import { FEED_TYPE_LABEL, SIDE_LABEL, type BreastSide, type FeedType } from "@/lib/types";

export const FEED_ICON: Record<FeedType, string> = { breast: "🤱", formula: "🍼", pumped: "🥛" };
export const AMOUNT_PRESETS = [40, 60, 80, 100, 120, 140, 160, 180];

type ChoiceProps<T extends string> = {
  value: T;
  options: readonly { value: T; label: string; icon?: string }[];
  onChange: (v: T) => void;
  label: string;
};

export function ChoiceGroup<T extends string>({ value, options, onChange, label }: ChoiceProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`btn flex-col border-2 py-3 text-base ${
            value === o.value ? "border-primary bg-primary-soft" : "border-line bg-surface"
          }`}
        >
          {o.icon && (
            <span className="text-2xl" aria-hidden>
              {o.icon}
            </span>
          )}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const TYPE_OPTIONS = (Object.keys(FEED_TYPE_LABEL) as FeedType[]).map((v) => ({
  value: v,
  label: FEED_TYPE_LABEL[v],
  icon: FEED_ICON[v],
}));

export const SIDE_OPTIONS = (Object.keys(SIDE_LABEL) as BreastSide[]).map((v) => ({
  value: v,
  label: SIDE_LABEL[v],
}));

/** 수유량 빠른 선택 + 직접 입력 */
export function AmountPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {AMOUNT_PRESETS.map((ml) => (
          <button
            key={ml}
            type="button"
            onClick={() => onChange(ml)}
            aria-pressed={value === ml}
            className={`btn border-2 py-3 text-lg ${value === ml ? "border-primary bg-primary-soft" : "border-line bg-surface"}`}
          >
            {ml}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2">
        <span className="shrink-0 font-semibold">직접 입력</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={500}
          value={value ?? ""}
          onChange={(e) => {
            const n = e.target.value === "" ? null : Math.min(500, Math.max(0, Number(e.target.value)));
            onChange(n);
          }}
          className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-lg outline-none focus:border-primary"
          placeholder="ml"
        />
        <span className="font-semibold">ml</span>
      </label>
    </div>
  );
}
