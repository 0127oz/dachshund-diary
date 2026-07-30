import { useMemo } from "react";
import { QUADRANTS, isOverdue, layoutGoals, type Goal } from "@/lib/goals";

/**
 * 가로축 = 기한(왼쪽 임박 → 오른쪽 여유)
 * 세로축 = 중요도(위 높음 → 아래 낮음)
 */
export function PriorityGrid({
  goals,
  onSelect,
}: {
  goals: Goal[];
  onSelect: (goal: Goal) => void;
}) {
  const placed = useMemo(() => layoutGoals(goals), [goals]);

  return (
    <section className="card-soft p-4" aria-label="기한과 중요도로 보는 목표 지도">
      <div className="flex gap-2">
        {/* 세로축 라벨 */}
        <div className="flex w-6 shrink-0 flex-col items-center justify-between py-2 text-[10px] font-black text-muted-foreground">
          <span className="leading-tight">
            중요
            <br />↑
          </span>
          <span className="leading-tight">
            ↓<br />
            낮음
          </span>
        </div>

        <div className="relative aspect-square flex-1 overflow-hidden rounded-[20px] border border-border">
          {/* 4분면 배경 */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            {QUADRANTS.map((q) => (
              <div key={q.key} className={`relative border-border/60 ${q.tone}`}>
                <span className="absolute left-2 top-2 text-[10px] font-black text-foreground/45">
                  {q.label}
                </span>
              </div>
            ))}
          </div>

          {/* 중앙 십자선 */}
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />

          {/* 목표 점 */}
          {placed.map(({ goal, x, y }) => {
            const overdue = isOverdue(goal);
            const dot = goal.is_done
              ? "bg-secondary text-secondary-foreground"
              : overdue
                ? "bg-accent text-accent-foreground ring-4 ring-accent/25"
                : "bg-primary text-primary-foreground";

            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => onSelect(goal)}
                style={{ left: `${x}%`, top: `${y}%` }}
                aria-label={`${goal.title} 목표 열기`}
                className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-transform hover:scale-110 focus-visible:scale-110 focus-visible:outline-none active:scale-95"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-black shadow-soft ${dot}`}
                >
                  {goal.is_done ? "✓" : goal.importance}
                </span>
                <span className="mt-0.5 max-w-[68px] truncate rounded-full bg-card/90 px-1.5 py-px text-[9px] font-bold text-foreground">
                  {goal.title}
                </span>
              </button>
            );
          })}

          {goals.length === 0 && (
            <p className="absolute inset-0 z-10 flex items-center justify-center text-xs font-bold text-muted-foreground">
              목표를 세우면 여기에 나타나요
            </p>
          )}
        </div>
      </div>

      {/* 가로축 라벨 */}
      <div className="mt-2 flex justify-between pl-8 text-[10px] font-black text-muted-foreground">
        <span>← 기한 임박</span>
        <span>여유 →</span>
      </div>

      <p className="mt-3 rounded-[14px] bg-muted/70 px-3 py-2 text-[11px] font-semibold text-muted-foreground">
        점 안의 숫자는 중요도, <span className="text-accent">코랄색</span>은 기한이 지난 목표예요.
        점을 누르면 자세히 볼 수 있어요.
      </p>
    </section>
  );
}
