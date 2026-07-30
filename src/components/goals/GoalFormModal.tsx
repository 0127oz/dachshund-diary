import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock, Users, X } from "lucide-react";
import { db } from "@/lib/db";
import { dateOnly, todayISO, type Goal } from "@/lib/goals";

function defaultDeadline() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function GoalFormModal({
  open,
  userId,
  goal,
  onClose,
  onSaved,
}: {
  open: boolean;
  userId: string;
  /** 있으면 수정 모드 */
  goal?: Goal | null;
  onClose: () => void;
  onSaved: (mode: "created" | "updated") => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [importance, setImportance] = useState(3);
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(goal?.title ?? "");
    setDescription(goal?.description ?? "");
    setImportance(goal?.importance ?? 3);
    setDeadline(goal ? dateOnly(goal.deadline) : defaultDeadline());
    setIsPublic(goal?.is_public ?? true);
  }, [open, goal]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function save() {
    const name = title.trim();
    if (name.length < 1) {
      toast.error("목표 이름을 적어줘!");
      return;
    }
    if (!deadline) {
      toast.error("기한을 골라줘!");
      return;
    }

    setBusy(true);
    const payload = {
      title: name,
      description: description.trim() || null,
      importance,
      deadline,
      is_public: isPublic,
    };

    const { error } = goal
      ? await db.from("goals").update(payload).eq("id", goal.id)
      : await db.from("goals").insert({ ...payload, user_id: userId });

    setBusy(false);

    if (error) {
      console.error(error);
      toast.error("저장하지 못했어. 다시 시도해줄래?");
      return;
    }
    onSaved(goal ? "updated" : "created");
    onClose();
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
        aria-label={goal ? "목표 수정" : "목표 만들기"}
        className="card-soft relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-b-none p-6 pb-8 sm:rounded-b-[24px]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl text-primary">{goal ? "목표 다듬기" : "새 목표 만들기"}</h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted"
          >
            <X size={20} />
          </button>
        </div>

        <label className="mt-5 block text-sm font-bold text-muted-foreground" htmlFor="goal-title">
          목표 이름
        </label>
        <input
          id="goal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={40}
          placeholder="예) 매일 30분 달리기"
          className="mt-2 w-full rounded-[18px] border border-border bg-muted px-4 py-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-ring/40"
        />

        <label className="mt-4 block text-sm font-bold text-muted-foreground" htmlFor="goal-desc">
          한 줄 설명 <span className="font-medium">(선택)</span>
        </label>
        <input
          id="goal-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={80}
          placeholder="왜 이걸 하고 싶어?"
          className="mt-2 w-full rounded-[18px] border border-border bg-muted px-4 py-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-ring/40"
        />

        <p className="mt-4 text-sm font-bold text-muted-foreground">중요도</p>
        <div className="mt-2 flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setImportance(n)}
              aria-label={`중요도 ${n}점`}
              aria-pressed={importance === n}
              className={`flex-1 rounded-[16px] py-3 text-xl transition-transform active:scale-95 ${
                n <= importance ? "bg-accent/15" : "bg-muted"
              }`}
            >
              <span className={n <= importance ? "" : "opacity-25 grayscale"}>⭐</span>
            </button>
          ))}
        </div>

        <label
          className="mt-4 block text-sm font-bold text-muted-foreground"
          htmlFor="goal-deadline"
        >
          기한
        </label>
        <input
          id="goal-deadline"
          type="date"
          value={deadline}
          min={goal ? undefined : todayISO()}
          onChange={(e) => setDeadline(e.target.value)}
          className="mt-2 w-full rounded-[18px] border border-border bg-muted px-4 py-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-ring/40"
        />

        {/* 공개 여부 */}
        <p className="mt-4 text-sm font-bold text-muted-foreground">공개 범위</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setIsPublic(true)}
            aria-pressed={isPublic}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-[16px] py-3 text-sm font-bold transition-transform active:scale-95 ${
              isPublic ? "bg-accent text-accent-foreground shadow-pop" : "bg-muted text-foreground"
            }`}
          >
            <Users size={16} />
            모두에게 공개
          </button>
          <button
            type="button"
            onClick={() => setIsPublic(false)}
            aria-pressed={!isPublic}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-[16px] py-3 text-sm font-bold transition-transform active:scale-95 ${
              !isPublic ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}
          >
            <Lock size={16} />
            나만 보기
          </button>
        </div>
        <p className="mt-1.5 text-[11px] font-semibold text-muted-foreground">
          {isPublic
            ? "모두의 목표 탭에 올라가고, 친구들이 응원할 수 있어요."
            : "내 목표 탭에서 나만 볼 수 있어요."}
        </p>

        <button
          onClick={save}
          disabled={busy}
          className="mt-6 w-full rounded-[18px] bg-accent px-4 py-3.5 text-base font-bold text-accent-foreground shadow-pop transition-transform active:scale-95 disabled:opacity-60"
        >
          {busy ? "저장 중..." : goal ? "수정 완료" : "목표 세우기"}
        </button>
      </div>
    </div>
  );
}
