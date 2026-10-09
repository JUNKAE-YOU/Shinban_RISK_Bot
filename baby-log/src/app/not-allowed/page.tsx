import SignOutButton from "@/components/SignOutButton";

export const metadata = { title: "접근 권한 없음 · 육아일지" };

export default function NotAllowedPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-6xl">🔒</div>
      <h1 className="text-2xl font-extrabold">접근 권한이 없어요</h1>
      <p className="text-muted">
        이 육아일지는 등록된 가족(아빠·엄마)만 볼 수 있어요.
        <br />
        다른 계정으로 로그인해 주세요.
      </p>
      <SignOutButton className="btn mt-2 bg-primary px-6 py-4 text-lg text-white" />
    </main>
  );
}
