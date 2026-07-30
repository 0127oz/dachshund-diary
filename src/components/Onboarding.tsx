import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dachshund } from "./Dachshund";
import type { Profile } from "@/hooks/useProfile";

export function Onboarding({ onDone }: { onDone: (p: Profile) => void }) {
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);

  async function start() {
    const name = nickname.trim();
    if (name.length < 1 || name.length > 12) {
      toast.error("닉네임은 1~12자로 적어줘!");
      return;
    }
    setBusy(true);
    try {
      let { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        userData = { user: data.user };
      }
      const uid = userData.user!.id;
      const { data, error } = await supabase
        .from("profiles")
        .upsert({ id: uid, nickname: name })
        .select()
        .single();
      if (error) throw error;
      onDone(data as Profile);
    } catch (e) {
      console.error(e);
      toast.error("앗, 시작하지 못했어. 다시 시도해줄래?");
    } finally {
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
            onKeyDown={(e) => e.key === "Enter" && start()}
            maxLength={12}
            placeholder="닉네임 입력"
            aria-label="닉네임"
            className="w-full rounded-[18px] border border-border bg-muted px-4 py-3 text-center text-base outline-none focus:border-accent focus:ring-2 focus:ring-ring/40"
          />
          <button
            onClick={start}
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