import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // 정적 파일, 이미지, 아이콘, PWA manifest 는 제외
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon.*|apple-icon.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
