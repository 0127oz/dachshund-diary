import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Dachshund } from "@/components/Dachshund";
import { CommentSheet } from "@/components/social/CommentSheet";
import { FeedCard } from "@/components/social/FeedCard";
import { useFeed, type FeedGoal } from "@/hooks/useGoals";
import type { Profile } from "@/hooks/useProfile";

export const Route = createFileRoute("/everyone")({ component: EveryoneRoute });

function EveryoneRoute() {
  return (
    <AppShell title="모두의 목표">
      {({ profile, userId }) => <Feed profile={profile} userId={userId} />}
    </AppShell>
  );
}

function Feed({ profile, userId }: { profile: Profile; userId: string }) {
  const { items, cheered, loading, toggleCheer, bumpCommentCount } = useFeed(userId);
  const [openGoal, setOpenGoal] = useState<FeedGoal | null>(null);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Dachshund mood="sleepy" size={120} className="animate-pulse" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card-soft flex flex-col items-center px-6 py-12 text-center">
        <Dachshund mood="happy" size={170} />
        <p className="mt-4 text-lg font-black text-primary">아직 아무도 목표를 안 세웠어.</p>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          네가 첫 번째가 되어볼래?
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm font-bold text-muted-foreground">
        발바닥 🐾 을 눌러 친구를 응원해줘요
      </p>

      <div className="mt-3 space-y-3">
        {items.map((goal) => (
          <FeedCard
            key={goal.id}
            goal={goal}
            isMine={goal.user_id === userId}
            cheered={cheered.has(goal.id)}
            onCheer={() => toggleCheer(goal.id)}
            onOpenComments={() => setOpenGoal(goal)}
          />
        ))}
      </div>

      <CommentSheet
        goal={openGoal}
        userId={userId}
        nickname={profile.nickname}
        onClose={() => setOpenGoal(null)}
        onCountChange={bumpCommentCount}
      />
    </>
  );
}
