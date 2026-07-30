import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Dachshund } from "@/components/Dachshund";

export const Route = createFileRoute("/everyone")({
  head: () => ({
    meta: [
      { title: "모두의 목표 — 응지의 목표수첩" },
      { name: "description", content: "다른 친구들이 공개한 목표를 구경하고 함께 응원해요." },
      { property: "og:title", content: "모두의 목표 — 응지의 목표수첩" },
      {
        property: "og:description",
        content: "다른 친구들이 공개한 목표를 구경하고 함께 응원해요.",
      },
    ],
  }),
  component: EveryonePage,
});

interface PublicGoal {
  id: string;
  title: string;
  emoji: string;
  is_done: boolean;
  user_id: string;
}

function EveryonePage() {
  return <AppShell title="모두의 목표">{() => <Everyone />}</AppShell>;
}

function Everyone() {
  const [goals, setGoals] = useState<PublicGoal[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("goals")
        .select("id, title, emoji, is_done, user_id")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(50);
      const list = (data as PublicGoal[]) ?? [];
      setGoals(list);
      const ids = [...new Set(list.map((g) => g.user_id))];
      if (ids.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, nickname")
          .in("id", ids);
        setNames(
          Object.fromEntries((profiles ?? []).map((p) => [p.id as string, p.nickname as string])),
        );
      }
    }
    load();
  }, []);

  if (goals.length === 0) {
    return (
      <div className="card-soft flex flex-col items-center gap-3 p-8 text-center">
        <Dachshund mood="sleepy" size={140} />
        <p className="text-sm font-semibold text-muted-foreground">
          아직 공개된 목표가 없어. 네가 첫 번째가 되어볼래?
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {goals.map((g) => (
        <li key={g.id} className="card-soft flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-muted text-lg">
            {g.emoji}
          </span>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{g.title}</p>
            <p className="text-xs text-muted-foreground">{names[g.user_id] ?? "익명 친구"}</p>
          </div>
          {g.is_done && (
            <span className="rounded-full bg-mint px-3 py-1 text-xs font-bold text-mint-foreground">
              완료
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}