/**
 * 목표 달성 사진 업로드 유틸.
 *
 * - 브라우저에서 canvas 로 webp(품질 0.8)로 변환해 업로드하므로
 *   클라우드 용량을 적게 씁니다.
 * - 버킷(goal-photos)은 비공개라서 볼 때마다 서명 URL 을 발급합니다.
 */
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "goal-photos";
const MAX_EDGE = 1280; // 긴 변 기준 최대 픽셀
const QUALITY = 0.8;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 읽지 못했어요."));
    };
    img.src = url;
  });
}

/** 어떤 이미지든 webp Blob 으로 변환 (긴 변 1280px 로 축소) */
export async function toWebp(file: File): Promise<Blob> {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 변환하지 못했어요.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", QUALITY),
  );
  if (!blob) throw new Error("webp 로 변환하지 못했어요.");
  return blob;
}

/** 업로드 후 저장 경로(path)를 반환합니다. */
export async function uploadProofPhoto(
  userId: string,
  goalId: string,
  file: File,
): Promise<string> {
  const webp = await toWebp(file);
  const path = `${userId}/${goalId}-${Date.now()}.webp`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, webp, {
    contentType: "image/webp",
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export async function removeProofPhoto(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}

/** 비공개 버킷이라 서명 URL(1시간)을 발급해서 보여줍니다. */
export async function signedPhotoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) {
    console.error(error);
    return null;
  }
  return data?.signedUrl ?? null;
}
