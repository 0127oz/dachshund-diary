import { MessageCircle } from "lucide-react";
import { Dachshund } from "@/components/Dachshund";
import { ProgressBar } from "@/components/goals/ProgressBar";
import { StarRating } from "@/components/goals/StarIcon";
import { useProofPhoto } from "@/hooks/useProofPhoto";
import type { FeedGoal } from "@/hooks/useGoals";
import { dateOnly, ddayLabel, isOverdue } from "@/lib/goals";

export function FeedCard({
  goal,
  isMine,
  cheered,
  onCheer,
  onOpenComments,
}: {
  goal: FeedGoal;
  isMine: boolean;
  cheered: boolean;
  onCheer: () => void;
  onOpenComments: () => void;
}) {
  const overdue = isOverdue(goal);
  const photoUrl = useProofPhoto(goal.proof_photo_path);

  return (
    <article className="card-soft overflow-hidden">
      {goal.is_done && (
        <div className="flex items-center gap-2 bg-secondary/40 px-4 py-2">
          <Dachshund mood="proud" size={44} />
          <p className="text-xs font-black text-secondary-foreground">
            🎀 {goal.nickname} 님이 목표를 끝냈어요!
          </p>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-black text-primary">
            {goal.nickname}
            {isMine && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px]">나</span>
            )}
          </p>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
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

        <h3
          className={`mt-2 break-keep text-lg ${
            goal.is_done ? "text-muted-foreground line-through" : "text-foreground"
          }`}
        >
          {goal.title}
        </h3>

        {goal.description && (
          <p className="mt-1 text-sm font-medium text-muted-foreground">{goal.description}</p>
        )}

        <p className="mt-2 flex items-center gap-1 text-xs font-bold text-muted-foreground">
          <StarRating value={goal.importance} size={13} />
          <span>· 기한 {dateOnly(goal.deadline)}</span>
        </p>

        <ProgressBar
          value={goal.is_done ? 100 : goal.progress}
          done={goal.is_done}
          className="mt-2.5"
        />

        {goal.proof_photo_path && (
          <div className="mt-3 overflow-hidden rounded-[16px] bg-muted">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={`${goal.nickname} 님의 달성 사진`}
                loading="lazy"
                className="block max-h-80 w-full object-cover"
              />
            ) : (
              <div className="h-40 w-full motion-safe:animate-pulse" />
            )}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={onCheer}
            aria-pressed={cheered}
            aria-label={cheered ? "응원 취소" : "응원 보내기"}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-[16px] py-2.5 text-sm font-bold transition-transform active:scale-95 ${
              cheered ? "bg-accent text-accent-foreground shadow-pop" : "bg-muted text-foreground"
            }`}
          >
            <span className={cheered ? "motion-safe:animate-bounce" : ""}>🐾</span>
            응원 {goal.cheerCount}
          </button>

          <button
            onClick={onOpenComments}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[16px] bg-muted py-2.5 text-sm font-bold text-foreground transition-transform active:scale-95"
          >
            <MessageCircle size={16} />
            댓글 {goal.commentCount}
          </button>
        </div>
      </div>
    </article>
  );
}
