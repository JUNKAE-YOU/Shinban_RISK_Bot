import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

let client: SupabaseClient | undefined;

/** 브라우저용 Supabase 클라이언트 (싱글턴). 세션은 쿠키에 저장되어 proxy 와 공유됩니다. */
export function getSupabase() {
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}
