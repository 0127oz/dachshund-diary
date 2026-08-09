import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useProofPhotos } from "@/hooks/useProofPhotos";

/**
 * 달성 사진 그리드 + 라이트박스.
 * 그리드는 CSS(aspect-square + object-cover)로만 정사각형처럼 보여주고,
 * 원본 파일은 그대로 유지합니다. 모달에서는 원본 비율로 보여줍니다.
 */
export function PhotoGrid({ paths, alt }: { paths: string[]; alt: string }) {
  const urls = useProofPhotos(paths);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (paths.length === 0) return null;

  const cols = paths.length === 1 ? "grid-cols-1" : paths.length === 2 ? "grid-cols-2" : "grid-cols-3";

  return (
    <>
      <div className={`mt-3 grid gap-1.5 ${cols}`}>
        {paths.map((path, i) => (
          <button
            key={path}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={`${alt} ${i + 1}번째 사진 크게 보기`}
            className="relative aspect-square overflow-hidden rounded-[16px] bg-muted transition-transform active:scale-95"
          >
            {urls[i] ? (
              <img
                src={urls[i] as string}
                alt={`${alt} ${i + 1}`}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <span className="absolute inset-0 motion-safe:animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <PhotoLightbox
          urls={urls}
          alt={alt}
          index={openIndex}
          setIndex={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}

function PhotoLightbox({
  urls,
  alt,
  index,
  setIndex,
  onClose,
}: {
  urls: (string | null)[];
  alt: string;
  index: number;
  setIndex: (n: number) => void;
  onClose: () => void;
}) {
  const total = urls.length;
  const go = (delta: number) => setIndex((index + delta + total) % total);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/80 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${alt} 사진 보기`}
        className="relative flex w-full max-w-3xl flex-col items-center px-4"
      >
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute -top-12 right-4 rounded-full bg-background/90 p-2 text-foreground"
        >
          <X size={20} />
        </button>

        {urls[index] ? (
          <img
            src={urls[index] as string}
            alt={`${alt} ${index + 1}`}
            className="max-h-[75vh] w-auto max-w-full rounded-[20px] object-contain shadow-pop"
          />
        ) : (
          <div className="flex h-60 w-full items-center justify-center rounded-[20px] bg-background/90 text-sm font-bold text-muted-foreground">
            사진 불러오는 중...
          </div>
        )}

        {total > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="이전 사진"
              className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-2.5 text-foreground transition-transform active:scale-90"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="다음 사진"
              className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-background/90 p-2.5 text-foreground transition-transform active:scale-90"
            >
              <ChevronRight size={22} />
            </button>

            <div className="mt-4 flex items-center gap-1.5">
              {urls.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`${i + 1}번째 사진`}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? "w-5 bg-background" : "w-2 bg-background/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}