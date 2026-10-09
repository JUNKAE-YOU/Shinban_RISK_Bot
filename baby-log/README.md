# 👶 우리 아기 육아일지 (baby-log)

아빠·엄마 **두 사람만** 접근할 수 있는 육아 기록 웹앱입니다.
휴대폰 홈 화면에 추가하면 앱처럼 쓸 수 있어요 (PWA).

| 기능 | 내용 |
|---|---|
| 📔 날짜별 육아 메모 | 캘린더에서 날짜를 골라 기록하거나, 타임라인으로 한 달치를 훑어보기. 수정/삭제, 작성자(아빠/엄마) 표시 |
| 🎤 음성 입력 (STT) | 대형 버튼을 누르고 말하면 Web Speech API 가 한국어를 텍스트로 바꿔 입력창에 이어 붙임 |
| 🍼 수유 기록 | `수유 시작` / `수유 종료` 원클릭, 모유(좌/우/양쪽)·분유·유축 구분, 수유량 프리셋, 진행 중 타이머, 수유 간격, 최근 7일 차트·표 |
| 🔒 인증·권한 | 이메일 로그인(매직링크 또는 6자리 코드) + 선택적 Google 로그인. 허용 목록(`family_members`)에 있는 계정만 DB 읽기/쓰기 (Postgres RLS) |
| ⚡ 실시간 동기화 | Supabase Realtime — 엄마 폰에서 수유를 시작하면 아빠 폰에도 바로 타이머가 뜸 |

---

## 1) 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | **Next.js 16 (App Router) + TypeScript** | Vercel 무료 배포, `proxy.ts` 로 페이지 접근 1차 차단 |
| 스타일 | **Tailwind CSS v4** | 큰 터치 버튼·다크모드 구성이 빠름 |
| 백엔드/DB | **Supabase** (Postgres + Auth + Realtime) | **RLS 로 DB 레벨에서 권한 강제**, 실시간 구독 내장, 무료 플랜으로 충분 |
| 인증 연동 | `@supabase/ssr` | 세션을 쿠키에 저장 → 서버(proxy)와 브라우저가 같은 세션 사용 |
| 차트 | Recharts | 가벼운 막대 차트 |
| 날짜 | date-fns (ko 로케일) | |
| 음성 인식 | 브라우저 내장 Web Speech API | 별도 서버/비용 없음 |

> Firebase 대신 Supabase 를 고른 이유: "아빠·엄마만" 이라는 권한 규칙을 SQL 정책 한 곳(`is_family()`)에서
> 관리할 수 있고, 날짜/기간 통계 쿼리가 SQL 이라 간단하기 때문입니다.

### 보안 구조 (3중 방어)

1. **가입 차단** — Supabase 에서 신규 가입을 끄고 두 계정만 초대. 로그인도 `shouldCreateUser: false`.
2. **페이지 차단** — `src/proxy.ts` 가 모든 요청에서 JWT 를 검증(`getClaims`)하고, 로그인 안 됨 → `/login`,
   가족 아님 → `/not-allowed` 로 보냄.
3. **데이터 차단 (핵심)** — 모든 테이블에 RLS. `is_family()` 가 `true` 인 사용자만 select/insert/update/delete 가능.
   설령 누가 publishable key 로 API 를 직접 호출해도 데이터는 0건입니다. 작성자(`created_by`, `author_name`)는
   DB 트리거가 채우므로 클라이언트가 위조할 수 없습니다.

---

## 2) 프로젝트 셋업

### 이 저장소를 그대로 쓰는 경우

```bash
cd baby-log
npm install
cp .env.example .env.local   # 값 채우기 (아래 3단계 참고)
npm run dev                  # http://localhost:3000
```

### 처음부터 직접 만든다면 (참고용 명령어)

```bash
npx create-next-app@latest baby-log --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
cd baby-log
npm install @supabase/ssr @supabase/supabase-js recharts date-fns
```

---

## 3) Supabase 설정 (약 10분)

1. <https://supabase.com> 에서 새 프로젝트 생성 (Region: Northeast Asia (Seoul) 권장)
2. **SQL Editor** → `supabase/migrations/0001_init.sql` 내용을 붙여넣고 실행
3. 같은 SQL Editor 에서 **가족 등록** (반드시 소문자 이메일):
   ```sql
   insert into public.family_members (email, display_name) values
     ('dad@example.com', '아빠'),
     ('mom@example.com', '엄마');
   ```
4. **Authentication → Sign In / Providers**
   - `Allow new users to sign up` **끄기** (낯선 사람 가입 차단)
   - Email provider 켜기
5. **Authentication → Users → Invite user** 로 아빠·엄마 이메일 초대
   (또는 `Add user` → `Create new user` 에서 `Auto Confirm User` 체크)
6. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000` (배포 후엔 배포 주소)
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://<배포주소>/auth/callback`
7. **Authentication → Emails → Magic Link** 템플릿에 6자리 코드 추가 (권장)
   ```html
   <h2>육아일지 로그인</h2>
   <p><a href="{{ .ConfirmationURL }}">여기를 눌러 로그인</a></p>
   <p>또는 앱에 코드 입력: <b>{{ .Token }}</b></p>
   ```
   > 휴대폰 메일 앱에서 링크를 열면 다른 브라우저가 열려 로그인이 안 될 수 있어요.
   > 그럴 땐 코드를 입력하면 됩니다.
8. **Project Settings → API Keys** 에서 URL 과 Publishable key 를 `.env.local` 에 입력
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxx
   NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN=false
   ```

### (선택) Google 로그인
1. Google Cloud Console 에서 OAuth Client(Web) 생성, 승인된 리디렉션 URI 에
   `https://<project>.supabase.co/auth/v1/callback` 추가
2. Supabase **Authentication → Providers → Google** 에 Client ID/Secret 입력
3. `.env.local` 에 `NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN=true`
4. 가입이 꺼져 있으므로, Google 계정 이메일도 5번처럼 미리 초대돼 있어야 로그인됩니다.

---

## 4) 배포 (Vercel)

1. GitHub 저장소를 Vercel 에 Import → **Root Directory 를 `baby-log`** 로 지정
2. Environment Variables 에 `.env.local` 의 세 값을 입력 → Deploy
3. 배포 주소를 Supabase 의 Site URL / Redirect URLs 에 추가
4. 휴대폰에서 접속 → 공유 → **홈 화면에 추가**

> 🎤 음성 인식은 **HTTPS**(또는 localhost)에서만 동작합니다. Android Chrome, iOS Safari 14.5+, PC Chrome/Edge 지원.
> Firefox 는 미지원이라 버튼이 비활성화됩니다.

---

## 5) 코드 구조

```
baby-log/
├─ supabase/migrations/0001_init.sql   # 테이블, RLS, 트리거, Realtime
├─ src/
│  ├─ proxy.ts                          # 모든 요청: 세션 갱신 + 로그인/가족 여부로 접근 차단
│  ├─ lib/
│  │  ├─ supabase/client.ts             # 브라우저 클라이언트
│  │  ├─ supabase/server.ts             # Route Handler 용 클라이언트
│  │  ├─ supabase/proxy.ts              # updateSession(): 인증 게이트 로직
│  │  ├─ types.ts, date.ts
│  ├─ hooks/
│  │  ├─ useSpeechRecognition.ts        # Web Speech API (ko-KR, 자동 재시작, 오류 메시지)
│  │  ├─ useRealtimeQuery.ts            # 조회 + Realtime 구독 + 백그라운드 복귀 시 재조회
│  │  ├─ useNow.ts, useHydrated.ts
│  ├─ app/
│  │  ├─ login/                         # 이메일(링크/코드) + Google 로그인
│  │  ├─ auth/callback/route.ts         # OAuth/매직링크 code → 세션 교환
│  │  ├─ not-allowed/                   # 허용되지 않은 계정 안내
│  │  ├─ (app)/page.tsx                 # 📔 육아 일지
│  │  └─ (app)/feeding/page.tsx         # 🍼 수유 기록
│  └─ components/
│     ├─ memo/   MemoPage, MonthCalendar, MemoComposer, MicButton, MemoItem
│     └─ feeding/ FeedingPage, FeedingControls, FeedingSummary, FeedingChart, FeedingList, ManualFeedingSheet
```

### 데이터 모델

- `family_members(email, display_name)` — 허용 목록
- `memos(id, memo_date, content, created_by, author_name, created_at, updated_at)`
- `feedings(id, feed_type['breast'|'formula'|'pumped'], breast_side, amount_ml, started_at, ended_at, note, created_by, author_name, …)`
  - `ended_at IS NULL` 인 행 = 진행 중인 수유 (두 기기에서 공유)

### 핵심 흐름

- **음성 입력**: `MicButton` 누름 → `useSpeechRecognition.start()` → 말하는 동안 회색 미리보기(interim) →
  문장이 확정될 때마다 `onFinal` 로 입력창에 이어 붙임 → `저장`.
  Android 는 잠깐 말을 멈추면 인식이 끊기므로, 사용자가 `멈추기`를 누르기 전까지 자동 재시작합니다.
- **수유**: 종류 선택 → `수유 시작`(insert, `started_at=now`) → 타이머 → `수유 종료`(누른 시각을 종료 시각으로 고정) →
  수유량 선택 → update. 간격 = 직전 수유 시작 ~ 이번 수유 시작.
- **동기화**: `useRealtimeQuery` 가 `postgres_changes` 를 구독하고 변경 시 다시 조회. RLS 가 Realtime 에도 적용됩니다.
