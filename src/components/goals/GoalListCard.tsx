import { ProgressBar } from "@/components/goals/ProgressBar";
import { StarRating } from "@/components/goals/StarIcon";
import { ddayLabel, isOverdue, quadrantOf, type Goal } from "@/lib/goals";

export function GoalListCard({ goal, onSelect }: { goal: Goal; onSelect: (g: Goal) => void }) {
  const overdue = isOverdue(goal);
  const quadrant = quadrantOf(goal);

  return (
    <button
      type="button"
      onClick={() => onSelect(goal)}
      className="card-soft w-full p-4 text-left transition-transform active:scale-[0.98]"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={`truncate text-base font-extrabold ${
                goal.is_done ? "text-muted-foreground line-through" : "text-foreground"
              }`}
            >
              {goal.title}
            </p>
            {goal.is_done && <span className="shrink-0 text-sm">🎀</span>}
            {goal.proof_photo_path && <span className="shrink-0 text-sm">📸</span>}
          </div>

          {goal.description && (
            <p className="mt-1 truncate text-sm font-medium text-muted-foreground">
              {goal.description}
            </p>
          )}

          <ProgressBar
            value={goal.is_done ? 100 : goal.progress}
            done={goal.is_done}
            className="mt-2.5"
          />

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="flex items-center rounded-full bg-muted px-2 py-1 text-[11px] font-bold text-muted-foreground">
              <StarRating value={goal.importance} />
            </span>
            <span className="rounded-full bg-muted px-2 py-1 text-[11px] font-bold text-muted-foreground">
              {quadrant.label}
            </span>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${
            goal.is_done
              ? "bg-secondary text-secondary-foreground"
              : overdue
                ? "bg-accent text-accent-foreground"
                : "bg-primary/10 text-primary"
          }`}
        >
          {goal.is_done ? "완료" : ddayLabel(goal.deadline)}
        </span>
      </div>
    </button>
  );
}
