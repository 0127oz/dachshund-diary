import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getAccountState,
  linkEmailToAccount,
  signOut,
  type AccountState,
} from "@/lib/auth";

/**
 * 마이페이지의 계정 카드.
 *
 * - 익명 계정  → 이메일 연결 폼
 * - 연결된 계정 → 이메일 표시 + 로그아웃
 */
export function AccountCard() {
  const [state, setState] = useState<AccountState | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      const s = await getAccountState();
      if (active) setState(s);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      queueMicrotask(() => {
        void getAccountState().then((s) => {
          if (active) setState(s);
        });
      });
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!state?.hasSession) return null;

  return state.isAnonymous ? (
    <LinkForm userId={state.userId} />
  ) : (
    <LinkedAccount email={state.email} />
  );
}

/* ------------------------------------------------------------------ */
/* 익명 계정 — 이메일 연결                                               */
/* ------------------------------------------------------------------ */

function LinkForm({ userId }: { userId: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"linked" | "confirm_email" | null>(null);

  const valid = /\S+@\S+\.\S+/.test(email.trim()) && password.length >= 6;

  async function handleSubmit() {
    if (!valid || busy) return;
    setBusy(true);
    try {
      const result = await linkEmailToAccount(email.trim(), password);
      setDone(result.status);
      toast.success(
        result.status === "linked"
          ? "계정 연결 완료! 이제 어느 기기에서든 로그인할 수 있어."
          : "확인 메일 보냈어. 메일 속 링크를 눌러서 마무리해줘!",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "계정을 연결하지 못했어. 다시 해볼래?");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <section className="card-soft space-y-1.5 px-5 py-5">
        <p className="text-base text-primary">
          {done === "linked" ? "계정 연결 완료 🎉" : "메일함을 확인해주세요 📮"}
        </p>
        <p className="break-keep text-sm font-semibold text-muted-foreground">
          {done === "linked"
            ? `${email} 로 로그인하면 지금까지의 목표가 그대로 따라와요.`
            : `${email} 로 보낸 확인 링크를 누르면 연결이 끝나요. 그 전까지는 이 브라우저의 데이터를 지우지 말아주세요.`}
        </p>
      </section>
    );
  }

  return (
    <section className="card-soft space-y-3 px-5 py-5">
      <div className="space-y-1.5">
        <p className="text-base text-primary">계정을 연결하면 기록이 안전해져요</p>
        <p className="break-keep text-sm font-semibold text-muted-foreground">
          지금 목표들은 이 브라우저에만 저장돼 있어요. 이메일을 연결하면 캐시를 지워도, 다른
          기기에서도 그대로 볼 수 있어요. 지금까지의 기록은 사라지지 않고 그대로 옮겨져요.
        </p>
      </div>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        autoComplete="email"
        placeholder="이메일"
        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void handleSubmit();
        }}
        type="password"
        autoComplete="new-password"
        placeholder="비밀번호 (6자 이상)"
        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      <button
        onClick={() => void handleSubmit()}
        disabled={!valid || busy}
        className="w-full rounded-xl bg-primary py-2.5 text-sm font-black text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {busy ? "연결하는 중..." : "계정 연결하기"}
      </button>

      {userId && (
        <p className="text-center text-[11px] font-bold text-muted-foreground">
          계정 ID {userId.slice(0, 8)}
        </p>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 연결된 계정                                                          */
/* ------------------------------------------------------------------ */

function LinkedAccount({ email }: { email: string | null }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    // 익명 세션을 만드는 화면으로 돌아가면 새 익명 유저가 생기므로 로그인 화면으로 보냅니다
    void navigate({ to: "/login" });
  }

  return (
    <section className="card-soft flex items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0">
        <p className="text-xs font-bold text-muted-foreground">연결된 계정</p>
        <p className="truncate text-sm font-black text-foreground">{email ?? "이메일 없음"}</p>
      </div>
      <button
        onClick={() => void handleSignOut()}
        disabled={busy}
        className="shrink-0 rounded-xl border border-input px-3 py-2 text-xs font-black text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
      >
        로그아웃
      </button>
    </section>
  );
}
