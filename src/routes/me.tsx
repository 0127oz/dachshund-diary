import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { Dachshund } from "@/components/Dachshund";
import { AccountCard } from "@/components/AccountCard";
import { useMyStats } from "@/hooks/useGoals";
import type { Profile } from "@/hooks/useProfile";

export const Route = createFileRoute("/me")({ component: MeRoute });

function MeRoute() {
  return (
    <AppShell title="마이페이지">
      {({ profile, userId }) => <MyPage profile={profile} userId={userId} />}
    </AppShell>
  );
}

type ReceivedComment = {
  id: string;
  nickname: string;
  content: string;
  created_at: string;
  goals: { title: string } | null;
};

function MyPage({ profile, userId }: { profile: Profile; userId: string }) {
  const { stats, loading } = useMyStats(userId);
  const [received, setReceived] = useState<ReceivedComment[]>([]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data } = await db
        .from("comments")
        .select("id, nickname, content, created_at, goals!inner(title, user_id)")
        .eq("goals.user_id", userId)
        .neq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (alive && data) setReceived(data as unknown as ReceivedComment[]);
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  const rate = stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100);
  const mood = stats.done > 0 ? "proud" : "happy";

  return (
    <div className="space-y-4">
      <section className="card-soft flex flex-col items-center px-6 py-7 text-center">
        <Dachshund mood={mood} size={160} />
        <p className="mt-3 text-xl text-primary">{profile.nickname}</p>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          {loading ? "계산하는 중..." : `목표 ${stats.total}개 중 ${stats.done}개 완료`}
        </p>

        <div className="mt-4 w-full">
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${rate}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs font-black text-muted-foreground">완료율 {rate}%</p>
        </div>
      </section>

      {/* 익명 계정이면 이메일 연결 폼, 연결된 계정이면 이메일 + 로그아웃 */}
      <AccountCard />

      <section className="grid grid-cols-2 gap-3">
        <div className="card-soft px-4 py-5 text-center">
          <p className="text-3xl font-black text-accent">{stats.cheersReceived}</p>
          <p className="mt-1 text-xs font-bold text-muted-foreground">받은 응원 🐾</p>
        </div>
        <div className="card-soft px-4 py-5 text-center">
          <p className="text-3xl font-black text-primary">{stats.commentsReceived}</p>
          <p className="mt-1 text-xs font-bold text-muted-foreground">받은 댓글 💬</p>
        </div>
      </section>

      <section>
        <h2 className="text-base text-primary">나에게 온 응원</h2>
        {received.length === 0 ? (
          <p className="card-soft mt-3 px-4 py-6 text-center text-sm font-semibold text-muted-foreground">
            아직 응원이 없어요. 응지의 목표에서 먼저 응원해보는 건 어때요?
          </p>
        ) : (
          <div className="mt-3 space-y-2.5">
            {received.map((c) => (
              <div key={c.id} className="card-soft px-4 py-3">
                <p className="truncate text-[11px] font-bold text-muted-foreground">
                  {c.goals?.title}
                </p>
                <p className="mt-1 break-keep text-sm font-semibold">{c.content}</p>
                <p className="mt-1 text-[11px] font-black text-accent">— {c.nickname}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
