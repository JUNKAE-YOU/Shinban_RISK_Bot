export type Memo = {
  id: string;
  memo_date: string; // YYYY-MM-DD
  content: string;
  created_by: string | null;
  author_name: string | null;
  created_at: string;
  updated_at: string;
};

export type FeedType = "breast" | "formula" | "pumped";
export type BreastSide = "left" | "right" | "both";

export type Feeding = {
  id: string;
  feed_type: FeedType;
  breast_side: BreastSide | null;
  amount_ml: number | null;
  started_at: string;
  ended_at: string | null;
  note: string | null;
  created_by: string | null;
  author_name: string | null;
  created_at: string;
  updated_at: string;
};

export const FEED_TYPE_LABEL: Record<FeedType, string> = {
  breast: "모유 (직수)",
  formula: "분유",
  pumped: "유축 모유",
};

export const SIDE_LABEL: Record<BreastSide, string> = {
  left: "왼쪽",
  right: "오른쪽",
  both: "양쪽",
};
