"use client";

import { getSupabase } from "@/lib/supabase/client";

export default function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await getSupabase().auth.signOut();
        // 쿠키가 바뀌었으므로 전체 새로고침으로 proxy 의 권한 확인을 다시 거칩니다.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/login");
      }}
    >
      로그아웃
    </button>
  );
}
