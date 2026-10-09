"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

type Result<T> = {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * Supabase 테이블을 조회하고, 다른 기기(아빠/엄마 폰)에서 변경이 생기면
 * Realtime 으로 감지해 자동으로 다시 불러옵니다.
 *
 * @param table  구독할 테이블 이름
 * @param fetcher 조회 함수 (key 가 바뀌면 다시 실행)
 * @param key    조회 조건이 바뀌었음을 알리는 문자열 (예: 선택한 월)
 */
export function useRealtimeQuery<T>(
  table: string,
  fetcher: () => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  key: string,
): Result<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  // 오래된 요청의 응답이 최신 응답을 덮어쓰지 않도록 요청 번호를 관리
  const requestId = useRef(0);

  const refetch = useCallback(async () => {
    const id = ++requestId.current;
    const { data, error } = await fetcherRef.current();
    if (id !== requestId.current) return;
    setError(error?.message ?? null);
    if (data) setData(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refetch();
  }, [key, refetch]);

  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel(`rt-${table}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        void refetch();
      })
      .subscribe();

    // 휴대폰이 잠금/백그라운드에서 돌아오면 놓친 변경분을 다시 불러옴
    const onVisible = () => {
      if (document.visibilityState === "visible") void refetch();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [table, refetch]);

  return { data, loading, error, refetch };
}
