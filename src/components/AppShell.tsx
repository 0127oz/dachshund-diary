import type { ReactNode } from "react";
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
    return <Onboarding onDone={setProfile} />;
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-28 pt-8">
      <h1 className="text-2xl text-primary">{title}</h1>
      <div className="mt-5">{children({ profile, userId })}</div>
      <TabBar />
    </div>
  );
}