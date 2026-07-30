import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Dachshund } from "@/components/Dachshund";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "내 목표 — 응지의 목표수첩" },
      {
        name: "description",
        content: "닥스훈트 댁이와 함께 오늘의 목표를 적고 하나씩 완료해보세요.",
      },
      { property: "og:title", content: "내 목표 — 응지의 목표수첩" },
      {
        property: "og:description",
        content: "닥스훈트 댁이와 함께 오늘의 목표를 적고 하나씩 완료해보세요.",
      },
    ],
  }),
  component: MyGoalsPage,
});

interface Goal {
  id: string;
  title: string;
  emoji: string;
  is_done: boolean;
  is_public: boolean;
}

const EMOJIS = ["🎯", "📚", "🏃", "🥗", "💰", "🎨"];

function MyGoalsPage() {
  return <AppShell title="내 목표">{({ userId }) => <MyGoals userId={userId} />}</AppShell>;
}

function MyGoals({ userId }: { userId: string }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);

  useEffect(() => {
    supabase
      .from("goals")
      .select("id, title, emoji, is_done, is_public")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setGoals((data as Goal[]) ?? []));
  }, [userId]);

  async function add() {
    const t = title.trim();
    if (!t) return;
    const { data, error } = await supabase
      .from("goals")
      .insert({ user_id: userId, title: t, emoji })
      .select("id, title, emoji, is_done, is_public")
      .single();
    if (error) {
      toast.error("목표를 저장하지 못했어요.");
      return;
    }
    setGoals((g) => [data as Goal, ...g]);
    setTitle("");
  }

  async function toggle(goal: Goal) {
    setGoals((g) => g.map((x) => (x.id === goal.id ? { ...x, is_done: !x.is_done } : x)));
    await supabase.from("goals").update({ is_done: !goal.is_done }).eq("id", goal.id);
    if (!goal.is_done) toast.success("잘했어! 댁이가 응원해 🐾");
  }

  async function remove(id: string) {
    setGoals((g) => g.filter((x) => x.id !== id));
    await supabase.from("goals").delete().eq("id", id);
  }

  const done = goals.filter((g) => g.is_done).length;

  return (
    <div className="space-y-5">
      <section className="card-soft flex items-center gap-3 p-5">
        <Dachshund mood={done > 0 ? "proud" : "cheer"} size={110} />
        <div>
          <p className="text-sm font-semibold text-muted-foreground">오늘의 진행</p>
          <p className="text-xl font-extrabold text-primary">
            {done} / {goals.length} 완료
          </p>
        </div>
      </section>

      <section className="card-soft space-y-3 p-5">
        <div className="flex gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              aria-label={`이모지 ${e}`}
              className={`h-10 w-10 rounded-[14px] text-lg transition ${
                emoji === e ? "bg-accent/20 ring-2 ring-accent" : "bg-muted"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            maxLength={60}
            placeholder="새로운 목표를 적어봐!"
            aria-label="새 목표"
            className="flex-1 rounded-[18px] border border-border bg-muted px-4 py-3 outline-none focus:border-accent"
          />
          <button
            onClick={add}
            aria-label="목표 추가"
            className="rounded-[18px] bg-accent px-4 text-accent-foreground shadow-pop active:scale-95"
          >
            <Plus />
          </button>
        </div>
      </section>

      {goals.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          아직 목표가 없어. 첫 목표를 적어볼까?
        </p>
      ) : (
        <ul className="space-y-3">
          {goals.map((g) => (
            <li key={g.id} className="card-soft flex items-center gap-3 p-4">
              <button
                onClick={() => toggle(g)}
                aria-label="완료 토글"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-lg ${
                  g.is_done ? "bg-mint text-mint-foreground" : "bg-muted"
                }`}
              >
                {g.emoji}
              </button>
              <span
                className={`flex-1 font-semibold ${
                  g.is_done ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {g.title}
              </span>
              <button
                onClick={() => remove(g.id)}
                aria-label="목표 삭제"
                className="text-muted-foreground transition hover:text-destructive"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
