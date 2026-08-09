import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Check, ImagePlus, Lock, Pencil, RotateCcw, Trash2, Users, X } from "lucide-react";
import { ProgressBar } from "@/components/goals/ProgressBar";
import { StarRating } from "@/components/goals/StarIcon";
import { useProofPhoto } from "@/hooks/useProofPhoto";
import { db } from "@/lib/db";
import { removeProofPhoto, uploadProofPhoto } from "@/lib/photo";
import { dateOnly, ddayLabel, isOverdue, quadrantOf, type Goal } from "@/lib/goals";

export function GoalDetailSheet({
  goal,
  onClose,
  onEdit,
  onChanged,
}: {
  goal: Goal | null;
  onClose: () => void;
  onEdit: (goal: Goal) => void;
  onChanged: (event: "done" | "undone" | "deleted" | "visibility" | "progress") => void;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [savedProgress, setSavedProgress] = useState(0);
  const [savingProgress, setSavingProgress] = useState(false);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoUrl = useProofPhoto(photoPath);

  useEffect(() => {
    if (!goal) return;
    const value = goal.is_done ? 100 : goal.progress;
    setProgress(value);
    setSavedProgress(value);
    setPhotoPath(goal.proof_photo_path ?? null);
  }, [goal]);

  useEffect(() => {
    if (!goal) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goal, onClose]);

  if (!goal) return null;

  const overdue = isOverdue(goal);
  const quadrant = quadrantOf(goal);
  const progressDirty = progress !== savedProgress;

  async function pickPhoto(file: File | undefined) {
    if (!goal || !file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 올릴 수 있어요.");
      return;
    }

    setUploading(true);
    try {
      const path = await uploadProofPhoto(goal.user_id, goal.id, file);
      const { error } = await db.from("goals").update({ proof_photo_path: path }).eq("id", goal.id);
      if (error) throw error;

      const old = photoPath;
      setPhotoPath(path);
      if (old && old !== path) void removeProofPhoto(old);
      toast.success("달성 사진을 올렸어요 📸 (webp로 저장)");
      onChanged("progress");
    } catch (e) {
      console.error(e);
      toast.error("사진을 올리지 못했어. 다시 해볼래?");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function deletePhoto() {
    if (!goal || !photoPath) return;
    setUploading(true);
    const { error } = await db.from("goals").update({ proof_photo_path: null }).eq("id", goal.id);
    if (error) {
      console.error(error);
      toast.error("사진을 지우지 못했어.");
      setUploading(false);
      return;
    }
    void removeProofPhoto(photoPath);
    setPhotoPath(null);
    setUploading(false);
    toast.success("달성 사진을 지웠어요");
    onChanged("progress");
  }

  async function saveProgress() {
    if (!goal) return;
    setSavingProgress(true);
    const complete = progress === 100;
    const { error } = await db
      .from("goals")
      .update(complete ? { progress, is_done: true } : { progress })
      .eq("id", goal.id);
    setSavingProgress(false);

    if (error) {
      console.error(error);
      toast.error("진행률을 저장하지 못했어.");
      return;
    }
    setSavedProgress(progress);

    if (complete) {
      toast.success("100% 달성! 목표 완료로 바꿨어요 🎉");
      onChanged("done");
      onClose();
      return;
    }

    toast.success(`진행률 ${progress}% 저장했어요`);
    onChanged("progress");
  }

  async function toggleDone() {
    if (!goal) return;
    setBusy(true);
    const next = !goal.is_done;
    const { error } = await db.from("goals").update({ is_done: next }).eq("id", goal.id);
    setBusy(false);

    if (error) {
      console.error(error);
      toast.error("상태를 바꾸지 못했어.");
      return;
    }
    onChanged(next ? "done" : "undone");
    onClose();
  }

  async function toggleVisibility() {
    if (!goal) return;
    setBusy(true);
    const next = !goal.is_public;
    const { error } = await db.from("goals").update({ is_public: next }).eq("id", goal.id);
    setBusy(false);

    if (error) {
      console.error(error);
      toast.error("공개 설정을 바꾸지 못했어.");
      return;
    }
    toast.success(next ? "응지의 목표에 공개했어요" : "나만 보기로 바꿨어요");
    onChanged("visibility");
    onClose();
  }

  async function remove() {
    if (!goal) return;
    if (!window.confirm(`"${goal.title}" 목표를 지울까요? 되돌릴 수 없어요.`)) return;

    setBusy(true);
    const { error } = await db.from("goals").delete().eq("id", goal.id);
    setBusy(false);

    if (error) {
      console.error(error);
      toast.error("삭제하지 못했어.");
      return;
    }
    onChanged("deleted");
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
        aria-label="목표 상세"
        className="card-soft relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-b-none p-6 pb-8 sm:rounded-b-[24px]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                  goal.is_done
                    ? "bg-secondary text-secondary-foreground"
                    : overdue
                      ? "bg-accent text-accent-foreground"
                      : "bg-primary/10 text-primary"
                }`}
              >
                {goal.is_done ? "완료함" : ddayLabel(goal.deadline)}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                {quadrant.label}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                {goal.is_public ? <Users size={11} /> : <Lock size={11} />}
                {goal.is_public ? "공개" : "나만 보기"}
              </span>
            </div>
            <h2 className="mt-2 break-keep text-xl text-primary">{goal.title}</h2>
          </div>

          <button
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted"
          >
            <X size={20} />
          </button>
        </div>

        {goal.description && (
          <p className="mt-3 rounded-[16px] bg-muted/70 px-4 py-3 text-sm font-semibold text-muted-foreground">
            {goal.description}
          </p>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-[16px] bg-muted/70 px-4 py-3">
            <dt className="text-[11px] font-bold text-muted-foreground">중요도</dt>
            <dd className="mt-0.5 flex items-center text-sm font-black">
              <StarRating value={goal.importance} size={16} />
            </dd>
          </div>
          <div className="rounded-[16px] bg-muted/70 px-4 py-3">
            <dt className="text-[11px] font-bold text-muted-foreground">기한</dt>
            <dd className="mt-0.5 text-sm font-black">{dateOnly(goal.deadline)}</dd>
          </div>
        </dl>

        {/* 진행률 */}
        <div className="mt-4 rounded-[18px] bg-muted/70 px-4 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-muted-foreground">진행률</p>
            <span className="text-lg font-black text-primary">{progress}%</span>
          </div>

          <ProgressBar value={progress} done={goal.is_done} className="mt-2.5" />

          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            disabled={goal.is_done || busy}
            onChange={(e) => setProgress(Number(e.target.value))}
            aria-label="진행률 조절"
            className="mt-3 h-2 w-full cursor-pointer accent-accent disabled:opacity-50"
          />

          <div className="mt-3 flex gap-1.5">
            {[0, 25, 50, 75, 100].map((n) => (
              <button
                key={n}
                type="button"
                disabled={goal.is_done || busy}
                onClick={() => setProgress(n)}
                className={`flex-1 rounded-[14px] py-2 text-[11px] font-bold transition-transform active:scale-95 disabled:opacity-50 ${
                  progress === n ? "bg-accent text-accent-foreground" : "bg-background text-foreground"
                }`}
              >
                {n}%
              </button>
            ))}
          </div>

          {goal.is_done ? (
            <p className="mt-2.5 text-[11px] font-semibold text-muted-foreground">
              완료한 목표는 100%로 고정돼요.
            </p>
          ) : (
            <button
              onClick={saveProgress}
              disabled={!progressDirty || savingProgress}
              className="mt-3 w-full rounded-[16px] bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-40"
            >
              {savingProgress ? "저장 중..." : progressDirty ? "진행률 저장" : "저장됨"}
            </button>
          )}
        </div>

        <div className="mt-5 space-y-2">
          <button
            onClick={toggleDone}
            disabled={busy}
            className={`flex w-full items-center justify-center gap-2 rounded-[18px] px-4 py-3.5 text-base font-bold transition-transform active:scale-95 disabled:opacity-60 ${
              goal.is_done
                ? "bg-muted text-muted-foreground"
                : "bg-accent text-accent-foreground shadow-pop"
            }`}
          >
            {goal.is_done ? <RotateCcw size={18} /> : <Check size={18} />}
            {goal.is_done ? "아직 진행 중으로 되돌리기" : "다 했어요!"}
          </button>

          <button
            onClick={toggleVisibility}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-muted px-4 py-3 text-sm font-bold text-foreground transition-transform active:scale-95 disabled:opacity-60"
          >
            {goal.is_public ? <Lock size={16} /> : <Users size={16} />}
            {goal.is_public ? "나만 보기로 바꾸기" : "응지의 목표에 공개하기"}
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => {
                onEdit(goal);
                onClose();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-[18px] bg-muted px-4 py-3 text-sm font-bold text-foreground transition-transform active:scale-95"
            >
              <Pencil size={16} />
              수정
            </button>
            <button
              onClick={remove}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-2 rounded-[18px] bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive transition-transform active:scale-95 disabled:opacity-60"
            >
              <Trash2 size={16} />
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
