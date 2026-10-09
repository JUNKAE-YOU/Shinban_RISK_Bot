"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import SignOutButton from "./SignOutButton";

const TABS = [
  { href: "/", label: "육아 일지", icon: "📔" },
  { href: "/feeding", label: "수유 기록", icon: "🍼" },
] as const;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    getSupabase()
      .rpc("current_member_name")
      .then(({ data }) => setName((data as string | null) ?? null));
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-background/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <h1 className="text-lg font-extrabold">👶 우리 아기 육아일지</h1>
        <div className="flex items-center gap-3 text-sm">
          {name && <span className="rounded-full bg-accent-soft px-3 py-1 font-semibold">{name}</span>}
          <SignOutButton className="text-muted underline" />
        </div>
      </header>

      <main className="flex-1 px-4 pb-32 pt-4">{children}</main>

      {/* 한 손으로 누르기 쉬운 큰 하단 탭 */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto grid max-w-2xl grid-cols-2">
          {TABS.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-3 text-base font-bold ${
                  active ? "text-primary" : "text-muted"
                }`}
              >
                <span className="text-3xl" aria-hidden>
                  {t.icon}
                </span>
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
