import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata = { title: "로그인 · 육아일지" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <div className="text-6xl">👶</div>
        <h1 className="mt-3 text-2xl font-extrabold">우리 아기 육아일지</h1>
        <p className="mt-1 text-muted">아빠와 엄마만 들어올 수 있어요</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
