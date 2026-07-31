import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Onboarding } from "./Onboarding";
import { TabBar } from "./TabBar";
import { Dachshund } from "./Dachshund";
import { useProfile, type Profile } from "@/hooks/useProfile";

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: (ctx: { profile: Profile; userId: string }) => ReactNode;
}) {
  const { loading, userId, profile, setProfile } = useProfile();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Dachshund mood="sleepy" size={140} className="animate-pulse" />
      </div>
    );
  }

  if (!profile || !userId) {
    return (
      <div className="relative min-h-screen">
        <Onboarding onDone={setProfile} />
        {/* 다른 기기에서 온 사람이 로그인으로 갈 수 있는 통로 */}
        <p className="fixed inset-x-0 bottom-6 text-center text-xs font-bold text-muted-foreground">
          이미 계정이 있나요?{" "}
          <Link to="/login" className="text-primary underline">
            로그인
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-28 pt-8">
      <h1 className="text-2xl text-primary">{title}</h1>
      <div className="mt-5">{children({ profile, userId })}</div>
      <TabBar />
    </div>
  );
}
