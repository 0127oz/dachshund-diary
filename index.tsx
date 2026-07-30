import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Dachshund } from "@/components/Dachshund";
import { GoalDetailSheet } from "@/components/goals/GoalDetailSheet";
import { GoalFormModal } from "@/components/goals/GoalFormModal";
import { GoalListCard } from "@/components/goals/GoalListCard";
import { PriorityGrid } from "@/components/goals/PriorityGrid";
import { useMyGoals } from "@/hooks/useGoals";
import { daysLeft, type Goal } from "@/lib/goals";

export const Route = createFileRoute("/")({ component: MyGoalsRoute });

function MyGoalsRoute() {
  return <AppShell title="내 목표">{({ userId }) => <MyGoals userId={userId} />}</AppShell>;
}

/** 목표를 세우거나 완료했을 때 잠깐 나타나는 댁이 */
function MascotBurst({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 1600);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <div className="card-soft flex flex-col items-center gap-1 px-8 py-6 motion-safe:animate-bounce">
        <Dachshund mood="cheer" size={150} />
        <p className="text-base font-black text-primary">{message}</p>
      </div>
    </div>
  );
}

function MyGoals({ userId }: { userId: string }) {
  const { goals, loading, refetch } = useMyGoals(userId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [selected, setSelected] = useState<Goal | null>(null);
  const [burst, setBurst] = useState<string | null>(null);

  // 진행 중인 목표를 D-day 순으로, 완료한 목표는 아래로
  const sorted = useMemo(
    () =>
      [...goals].sort(
        (a, b) =>
          Number(a.is_done) - Number(b.is_done) ||
          daysLeft(a.deadline) - daysLeft(b.deadline) ||
          b.importance - a.importance,
      ),
    [goals],
  );

  const doneCount = goals.filter((g) => g.is_done).length;

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Dachshund mood="sleepy" size={120} className="animate-pulse" />
      </div>
    );
  }

  return (
    <>
      {goals.length === 0 ? (
        <div className="card-soft flex flex-col items-center px-6 py-12 text-center">
          <Dachshund mood="sleepy" size={180} />
          <p className="mt-4 text-lg font-black text-primary">아직 목표가 없네.</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">하나 만들어볼까?</p>
          <button
            onClick={openNew}
            className="mt-5 rounded-[18px] bg-accent px-6 py-3 text-base font-bold text-accent-foreground shadow-pop transition-transform active:scale-95"
          >
            첫 목표 세우기
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm font-bold text-muted-foreground">
            목표 {goals.length}개 중 {doneCount}개 완료했어요
          </p>

          <PriorityGrid goals={goals} onSelect={setSelected} />

          <div>
            <h2 className="text-base text-primary">기한이 가까운 순서</h2>
            <div className="mt-3 space-y-2.5">
              {sorted.map((goal) => (
                <GoalListCard key={goal.id} goal={goal} onSelect={setSelected} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 목표 추가 버튼 */}
      {goals.length > 0 && (
        <button
          onClick={openNew}
          aria-label="목표 만들기"
          className="fixed bottom-24 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-base font-bold text-accent-foreground shadow-pop transition-transform active:scale-95"
        >
          <Plus size={20} />
          목표 만들기
        </button>
      )}

      <GoalFormModal
        open={formOpen}
        userId={userId}
        goal={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(mode) => {
          void refetch();
          setBurst(mode === "created" ? "좋아! 같이 해보자 🐾" : "수정했어!");
        }}
      />

      <GoalDetailSheet
        goal={selected}
        onClose={() => setSelected(null)}
        onEdit={(goal) => {
          setEditing(goal);
          setFormOpen(true);
        }}
        onChanged={(event) => {
          void refetch();
          if (event === "done") setBurst("해냈다! 정말 멋져 🎉");
        }}
      />

      {burst && <MascotBurst message={burst} onDone={() => setBurst(null)} />}
    </>
  );
}
