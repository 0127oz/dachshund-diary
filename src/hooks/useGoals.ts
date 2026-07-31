import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { db } from "@/lib/db";
import type { Goal } from "@/lib/goals";

/* ------------------------------------------------------------------ */
/* 2단계 — 내 목표                                                      */
/* ------------------------------------------------------------------ */

export function useMyGoals(userId: string) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const { data, error } = await db
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("deadline", { ascending: true });

    if (error) {
      console.error(error);
      toast.error("목표를 불러오지 못했어. 새로고침 해줄래?");
    } else {
      setGoals((data ?? []) as Goal[]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { goals, loading, refetch };
}

/* ------------------------------------------------------------------ */
/* 3단계 — 응지의 목표 피드                                              */
/* ------------------------------------------------------------------ */

export type FeedGoal = Goal & {
  nickname: string;
  cheerCount: number;
  commentCount: number;
};

/** PostgREST 의 집계 임베딩 결과([{count: n}])를 숫자로 */
function toCount(rows: unknown): number {
  if (Array.isArray(rows) && rows.length > 0) {
    const first = rows[0] as { count?: number };
    return first.count ?? 0;
  }
  return 0;
}

export function useFeed(userId: string) {
  const [items, setItems] = useState<FeedGoal[]>([]);
  const [cheered, setCheered] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    // is_public = true 인 목표만 피드에 노출됩니다
    const { data: rows, error } = await db
      .from("goals")
      .select("*, comments(count), cheers(count)")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) {
      console.error(error);
      toast.error("피드를 불러오지 못했어.");
      setLoading(false);
      return;
    }

    const goals = (rows ?? []) as (Goal & { comments?: unknown; cheers?: unknown })[];

    // 닉네임은 profiles 를 따로 조회해서 합칩니다
    // (외래키 임베딩에 의존하지 않으므로 스키마가 달라도 동작합니다)
    const authorIds = Array.from(new Set(goals.map((g) => g.user_id)));
    const nameMap = new Map<string, string>();
    if (authorIds.length > 0) {
      const { data: profiles } = await db
        .from("profiles")
        .select("id, nickname")
        .in("id", authorIds);
      for (const p of profiles ?? []) {
        nameMap.set(p.id as string, p.nickname as string);
      }
    }

    setItems(
      goals.map((g) => ({
        ...(g as Goal),
        nickname: nameMap.get(g.user_id) ?? "이름 없는 친구",
        cheerCount: toCount(g.cheers),
        commentCount: toCount(g.comments),
      })),
    );

    const { data: mine } = await db.from("cheers").select("goal_id").eq("user_id", userId);
    setCheered(new Set((mine ?? []).map((r) => r.goal_id as string)));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  /** 응원 토글 — 화면을 먼저 바꾸고 서버에 반영, 실패하면 되돌립니다 */
  const toggleCheer = useCallback(
    async (goalId: string) => {
      const wasCheered = cheered.has(goalId);

      setCheered((prev) => {
        const next = new Set(prev);
        if (wasCheered) next.delete(goalId);
        else next.add(goalId);
        return next;
      });
      setItems((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? { ...g, cheerCount: Math.max(0, g.cheerCount + (wasCheered ? -1 : 1)) }
            : g,
        ),
      );

      const { error } = wasCheered
        ? await db.from("cheers").delete().eq("goal_id", goalId).eq("user_id", userId)
        : await db.from("cheers").insert({ goal_id: goalId, user_id: userId });

      if (error) {
        console.error(error);
        toast.error("응원을 보내지 못했어. 다시 해볼래?");
        void refetch();
      }
    },
    [cheered, userId, refetch],
  );

  /** 댓글 개수만 갱신할 때 사용 */
  const bumpCommentCount = useCallback((goalId: string, delta: number) => {
    setItems((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, commentCount: Math.max(0, g.commentCount + delta) } : g,
      ),
    );
  }, []);

  return { items, cheered, loading, refetch, toggleCheer, bumpCommentCount };
}

/* ------------------------------------------------------------------ */
/* 3단계 — 마이페이지 통계                                               */
/* ------------------------------------------------------------------ */

export type MyStats = {
  total: number;
  done: number;
  cheersReceived: number;
  commentsReceived: number;
};

export function useMyStats(userId: string) {
  const [stats, setStats] = useState<MyStats>({
    total: 0,
    done: 0,
    cheersReceived: 0,
    commentsReceived: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    void (async () => {
      const head = { count: "exact" as const, head: true };
      const [total, done, cheers, comments] = await Promise.all([
        db.from("goals").select("id", head).eq("user_id", userId),
        db.from("goals").select("id", head).eq("user_id", userId).eq("is_done", true),
        // 내 목표에 달린 응원 중 내가 누른 것은 제외
        db
          .from("cheers")
          .select("id, goals!inner(user_id)", head)
          .eq("goals.user_id", userId)
          .neq("user_id", userId),
        db
          .from("comments")
          .select("id, goals!inner(user_id)", head)
          .eq("goals.user_id", userId)
          .neq("user_id", userId),
      ]);

      if (!alive) return;
      setStats({
        total: total.count ?? 0,
        done: done.count ?? 0,
        cheersReceived: cheers.count ?? 0,
        commentsReceived: comments.count ?? 0,
      });
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [userId]);

  return { stats, loading };
}
