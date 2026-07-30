import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Dachshund } from "@/components/Dachshund";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "마이페이지 — 응지의 목표수첩" },
      { name: "description", content: "닉네임을 바꾸고 나의 목표 기록을 한눈에 확인해요." },
      { property: "og:title", content: "마이페이지 — 응지의 목표수첩" },
      { property: "og:description", content: "닉네임을 바꾸고 나의 목표 기록을 한눈에 확인해요." },
    ],
  }),
  component: MyPage,
});

function MyPage() {
  return (
    <AppShell title="마이페이지">
      {({ profile, userId }) => <Me userId={userId} nickname={profile.nickname} />}
    </AppShell>
  );
}

function Me({ userId, nickname }: { userId: string; nickname: string }) {
  const [name, setName] = useState(nickname);
  const [stats, setStats] = useState({ total: 0, done: 0 });

  useEffect(() => {
    supabase
      .from("goals")
      .select("is_done")
      .eq("user_id", userId)
      .then(({ data }) => {
        const rows = data ?? [];
        setStats({ total: rows.length, done: rows.filter((r) => r.is_done).length });
      });
  }, [userId]);

  async function save() {
    const n = name.trim();
    if (n.length < 1 || n.length > 12) {
      toast.error("닉네임은 1~12자로 적어줘!");
      return;
    }
    const { error } = await supabase.from("profiles").update({ nickname: n }).eq("id", userId);
    if (error) toast.error("저장하지 못했어요.");
    else toast.success("닉네임을 바꿨어!");
  }

  return (
    <div className="space-y-5">
      <section className="card-soft flex flex-col items-center gap-2 p-6 text-center">
        <Dachshund mood="proud" size={170} />
        <p className="text-xl font-extrabold text-primary">{nickname}</p>
        <p className="text-sm text-muted-foreground">
          목표 {stats.total}개 중 {stats.done}개 완료
        </p>
      </section>

      <section className="card-soft space-y-3 p-5">
        <label htmlFor="nick" className="text-sm font-bold text-muted-foreground">
          닉네임 바꾸기
        </label>
        <input
          id="nick"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={12}
          className="w-full rounded-[18px] border border-border bg-muted px-4 py-3 outline-none focus:border-accent"
        />
        <button
          onClick={save}
          className="w-full rounded-[18px] bg-accent px-4 py-3 font-bold text-accent-foreground shadow-pop active:scale-95"
        >
          저장하기
        </button>
      </section>
    </div>
  );
}