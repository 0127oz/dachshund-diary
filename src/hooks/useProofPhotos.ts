import { useEffect, useState } from "react";
import { signedPhotoUrls } from "@/lib/photo";

/** 여러 장의 달성 사진 경로 → 서명 URL 배열 (경로와 같은 순서, 실패는 null) */
export function useProofPhotos(paths: string[]): (string | null)[] {
  const key = paths.join("|");
  const [urls, setUrls] = useState<(string | null)[]>([]);

  useEffect(() => {
    let alive = true;
    const list = key ? key.split("|") : [];
    if (list.length === 0) {
      setUrls([]);
      return;
    }
    void signedPhotoUrls(list).then((next) => {
      if (alive) setUrls(next);
    });
    return () => {
      alive = false;
    };
  }, [key]);

  return urls;
}