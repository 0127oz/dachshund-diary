import { useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ensureSession } from "@/lib/auth";
import { Dachshund } from "./Dachshund";
import type { Profile } from "@/hooks/useProfile";

export function Onboarding({ onDone }: { onDone: (p: Profile) => void }) {
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);

  // setBusy 는 비동기라 연타를 막지 못합니다.
  // Enter 키는 disabled 도 안 통하므로 동기적인 ref 로 한 번 더 막습니다.
  const runningRef = useRef(false);

  async function start() {
    if (runningRef.current) return;

    const name = nickname.trim();
    if (name.length < 1 || name.length > 12) {
      toast.error("닉네임은 1~12자로 적어줘!");
      return;
    }

    runningRef.current = true;
    setBusy(true);
    try {
      // 세션 확보. 이미 있으면 그대로 쓰고, 없을 때만 익명 계정을 만듭니다.
      // 동시에 여러 번 불려도 계정은 하나만 생깁니다.
      const session = await ensureSession();
      if (!session) throw new Error("세션을 만들지 못했습니다");

      const uid = session.user.id;
      const { data, error } = await supabase
        .from("profiles")
        .upsert({ id: uid, nickname: name }, { onConflict: "id" })
        .select()
        .single();
      if (error) throw error;

      onDone(data as Profile);
    } catch (e) {
      console.error(e);
      toast.error("앗, 시작하지 못했어. 다시 시도해줄래?");
    } finally {
      runningRef.current = false;
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <Dachshund mood="happy" size={240} className="mx-auto" />
        <h1 className="mt-6 text-2xl text-primary">안녕! 나는 댁이야.</h1>
        <p className="mt-2 text-lg font-semibold text-muted-foreground">너를 뭐라고 부를까?</p>

        <div className="card-soft mt-8 p-5">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void start();
              }
            }}
            maxLength={12}
            placeholder="닉네임 입력"
            aria-label="닉네임"
            className="w-full rounded-[18px] border border-border bg-muted px-4 py-3 text-center text-base outline-none focus:border-accent focus:ring-2 focus:ring-ring/40"
          />
          <button
            onClick={() => void start()}
            disabled={busy}
            className="mt-4 w-full rounded-[18px] bg-accent px-4 py-3 text-base font-bold text-accent-foreground shadow-pop transition-transform active:scale-95 disabled:opacity-60"
          >
            {busy ? "준비 중..." : "시작하기"}
          </button>
        </div>
      </div>
    </main>
  );
}
