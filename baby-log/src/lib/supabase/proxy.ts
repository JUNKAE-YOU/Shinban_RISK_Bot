import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

/** 로그인 없이 접근 가능한 경로 */
const PUBLIC_PATHS = ["/login", "/auth"];
/** 로그인은 했지만 가족 목록에 없는 사용자가 보는 경로 */
const NOT_ALLOWED_PATH = "/not-allowed";

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * 1) 만료된 세션 토큰을 갱신해 쿠키에 다시 써 주고
 * 2) 로그인/가족 여부에 따라 페이지 접근을 1차로 막습니다.
 *
 * 실제 데이터 보호는 DB 의 RLS(is_family())가 담당하므로,
 * 여기는 "화면을 보여줄지" 를 결정하는 낙관적 체크입니다.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // getClaims() 는 JWT 서명을 검증하므로 쿠키 위조에 안전합니다.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const { pathname } = request.nextUrl;

  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    // 갱신된 세션 쿠키를 잃지 않도록 복사
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  if (!claims) {
    return isPublic(pathname) ? response : redirectTo("/login");
  }

  if (pathname.startsWith("/auth")) return response;

  const { data: isFamily } = await supabase.rpc("is_family");

  if (!isFamily) {
    return pathname === NOT_ALLOWED_PATH ? response : redirectTo(NOT_ALLOWED_PATH);
  }
  if (pathname === "/login" || pathname === NOT_ALLOWED_PATH) {
    return redirectTo("/");
  }
  return response;
}
