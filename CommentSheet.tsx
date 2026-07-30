import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Send, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dachshund } from "@/components/Dachshund";
import type { FeedGoal } from "@/hooks/useGoals";

type Comment = {
  id: string;
  goal_id: string;
  user_id: string;
  nickname: string;
  content: string;
  created_at: string;
};

const QUICK_CHEERS = ["화이팅!", "멋지다!", "나도 같이 할래", "거의 다 왔어!"];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  return `${Math.floor(hour / 24)}일 전`;
}

export function CommentSheet({
  goal,
  userId,
  nickname,
  onClose,
  onCountChange,
}: {
  goal: FeedGoal | null;
  userId: string;
  nickname: string;
  onClose: () => void;
  onCountChange: (goalId: string, delta: number) => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const goalId = goal?.id ?? null;

  const load = useCallback(async () => {
    if (!goalId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("goal_id", goalId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      toast.error("댓글을 불러오지 못했어.");
    } else {
      setComments((data ?? []) as Comment[]);
    }
    setLoading(false);
  }, [goalId]);

  useEffect(() => {
    setComments([]);
    setText("");
    void load();
  }, [load]);

  useEffect(() => {
    if (!goalId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goalId, onClose]);

  if (!goal) return null;

  async function send(content: string) {
    const body = content.trim();
    if (!body || !goal) return;

    setBusy(true);
    const { data, error } = await supabase
      .from("comments")
      .insert({ goal_id: goal.id, user_id: userId, nickname, content: body })
      .select()
      .single();
    setBusy(false);

    if (error) {
      console.error(error);
      toast.error("댓글을 남기지 못했어.");
      return;
    }
    setComments((prev) => [...prev, data as Comment]);
    setText("");
    onCountChange(goal.id, 1);
  }

  async function remove(comment: Comment) {
    const { error } = await supabase.from("comments").delete().eq("id", comment.id);
    if (error) {
      console.error(error);
      toast.error("댓글을 지우지 못했어.");
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== comment.id));
    onCountChange(comment.goal_id, -1);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-foreground/35 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="응원 댓글"
        className="card-soft relative flex max-h-[86vh] w-full max-w-md flex-col rounded-b-none p-5 pb-6 sm:rounded-b-[24px]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black text-muted-foreground">
              {goal.profiles?.nickname ?? "이름 없는 친구"} 님의 목표
            </p>
            <h2 className="mt-0.5 break-keep text-lg text-primary">{goal.title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted"
          >
            <X size={20} />
          </button>
        </div>

        {/* 댓글 목록 */}
        <div className="mt-4 min-h-[120px] flex-1 space-y-2.5 overflow-y-auto pr-1">
          {loading ? (
            <p className="py-6 text-center text-sm font-bold text-muted-foreground">
              불러오는 중...
            </p>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <Dachshund mood="happy" size={110} />
              <p className="mt-2 text-sm font-bold text-muted-foreground">
                첫 응원을 남겨줄래?
              </p>
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="rounded-[16px] bg-muted/70 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-black text-primary">
                    {c.nickname}
                    <span className="ml-1.5 font-bold text-muted-foreground">
                      {timeAgo(c.created_at)}
                    </span>
                  </p>
                  {c.user_id === userId && (
                    <button
                      onClick={() => remove(c)}
                      aria-label="내 댓글 삭제"
                      className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p className="mt-1 break-keep text-sm font-semibold">{c.content}</p>
              </div>
            ))
          )}
        </div>

        {/* 빠른 응원 */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {QUICK_CHEERS.map((chip) => (
            <button
              key={chip}
              onClick={() => send(chip)}
              disabled={busy}
              className="rounded-full bg-secondary/40 px-3 py-1.5 text-xs font-bold text-secondary-foreground transition-transform active:scale-95 disabled:opacity-60"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* 입력창 */}
        <div className="mt-2 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(text)}
            maxLength={100}
            placeholder="따뜻한 한마디 남기기"
            aria-label="댓글 입력"
            className="flex-1 rounded-[18px] border border-border bg-muted px-4 py-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-ring/40"
          />
          <button
            onClick={() => send(text)}
            disabled={busy || !text.trim()}
            aria-label="댓글 보내기"
            className="rounded-[18px] bg-accent px-4 text-accent-foreground shadow-pop transition-transform active:scale-95 disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
