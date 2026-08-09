import { useEffect, useState } from "react";
import { signedPhotoUrl } from "@/lib/photo";

/** 목표 달성 사진 경로 → 서명 URL */
export function useProofPhoto(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!path) {
      setUrl(null);
      return;
    }
    void signedPhotoUrl(path).then((next) => {
      if (alive) setUrl(next);
    });
    return () => {
      alive = false;
    };
  }, [path]);

  return url;
}
