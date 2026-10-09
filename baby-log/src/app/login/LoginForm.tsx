"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN === "true";

export default function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") ? "로그인에 실패했어요. 다시 시도해 주세요." : null,
  );

  const supabase = getSupabase();
  const redirectTo = () => `${window.location.origin}/auth/callback`;

  async function sendEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: redirectTo(),
        // 미리 초대/등록된 계정만 로그인 가능 (낯선 사람의 가입 차단)
        shouldCreateUser: false,
      },
    });
    setBusy(false);
    if (error) {
      setError("등록되지 않은 이메일이거나 메일 전송에 실패했어요.");
      return;
    }
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: "email",
    });
    if (error) {
      setBusy(false);
      setError("코드가 올바르지 않거나 만료되었어요.");
      return;
    }
    // 쿠키가 바뀌었으므로 전체 새로고침으로 proxy 의 권한 확인을 다시 거칩니다.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/");
  }

  async function signInWithGoogle() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) {
      setBusy(false);
      setError("Google 로그인에 실패했어요.");
    }
  }

  return (
    <div className="card space-y-4 p-6">
      {step === "email" ? (
        <form onSubmit={sendEmail} className="space-y-4">
          <label className="block">
            <span className="mb-2 block font-semibold">이메일</span>
            <input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-line bg-surface-2 px-4 py-4 text-lg outline-none focus:border-primary"
            />
          </label>
          <button type="submit" disabled={busy} className="btn w-full bg-primary py-4 text-lg text-white">
            {busy ? "보내는 중…" : "로그인 메일 받기"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-4">
          <p className="leading-relaxed">
            <b>{email}</b> 로 로그인 메일을 보냈어요.
            <br />
            메일의 <b>링크를 누르거나</b>, 메일에 있는 <b>6자리 코드</b>를 입력하세요.
          </p>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6,8}"
            maxLength={8}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="w-full rounded-xl border border-line bg-surface-2 px-4 py-4 text-center text-2xl tracking-[0.4em] outline-none focus:border-primary"
          />
          <button type="submit" disabled={busy} className="btn w-full bg-primary py-4 text-lg text-white">
            {busy ? "확인 중…" : "로그인"}
          </button>
          <button
            type="button"
            onClick={() => setStep("email")}
            className="w-full py-2 text-sm text-muted underline"
          >
            이메일 다시 입력
          </button>
        </form>
      )}

      {GOOGLE_ENABLED && step === "email" && (
        <>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="h-px flex-1 bg-line" /> 또는 <span className="h-px flex-1 bg-line" />
          </div>
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={busy}
            className="btn w-full border border-line bg-surface py-4 text-lg"
          >
            <span aria-hidden>🟢</span> Google 계정으로 로그인
          </button>
        </>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-primary-soft px-4 py-3 text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
