import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getAccountState,
  linkAccount,
  setPassword,
  signOut,
  stageOf,
  validateUsername,
  type AccountState,
} from "@/lib/auth";

const inputClass =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring";
const buttonClass =
  "w-full rounded-xl bg-primary py-2.5 text-sm font-black text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50";

/**
 * 마이페이지 계정 카드.
 * 익명 계정에 아이디/비밀번호를 붙여 어느 기기에서든 로그인할 수 있게 합니다.
 */
export function AccountCard() {
  const [state, setState] = useState<AccountState | null>(null);

  const refresh = useCallback(async () => {
    const s = await getAccountState();
    setState(s);
    return s;
  }, []);

  useEffect(() => {
    let active = true;

    void getAccountState().then((s) => {
      if (active) setState(s);
    });

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

  switch (stageOf(state)) {
    case "link":
      return <LinkForm userId={state.userId} onDone={refresh} />;
    case "set_password":
      return <PasswordOnlyForm username={state.username} onDone={refresh} />;
    case "done":
      return <LinkedAccount username={state.username} />;
  }
}

/* ------------------------------------------------------------------ */
/* 아이디 + 비밀번호 정하기                                              */
/* ------------------------------------------------------------------ */

function LinkForm({
  userId,
  onDone,
}: {
  userId: string | null;
  onDone: () => Promise<AccountState>;
}) {
  const [username, setUsername] = useState("");
  const [password, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const idError = username.length > 0 ? validateUsername(username) : null;
  const tooShort = password.length > 0 && password.length < 6;
  const mismatch = confirm.length > 0 && password !== confirm;
  const valid = !validateUsername(username) && password.length >= 6 && password === confirm;

  async function handleSubmit() {
    if (!valid || busy) return;
    setBusy(true);
    try {
      await linkAccount(username, password);
      toast.success("계정 연결 완료! 이제 어느 기기에서든 로그인할 수 있어.");
      await onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "계정을 연결하지 못했어.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card-soft space-y-3 px-5 py-5">
      <div className="space-y-1.5">
        <p className="text-base text-primary">계정을 만들면 기록이 안전해져요</p>
        <p className="break-keep text-sm font-semibold text-muted-foreground">
          지금 목표들은 이 브라우저에만 저장돼 있어요. 아이디를 만들면 캐시를 지워도, 다른
          기기에서도 그대로 볼 수 있어요. 지금까지의 기록은 사라지지 않고 그대로 옮겨져요.
        </p>
      </div>

      <div className="space-y-1">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          placeholder="아이디 (영문 소문자·숫자·_)"
          className={inputClass}
        />
        {idError && <p className="text-xs font-bold text-destructive">{idError}</p>}
      </div>

      <input
        value={password}
        onChange={(e) => setPw(e.target.value)}
        type="password"
        autoComplete="new-password"
        placeholder="비밀번호 (6자 이상)"
        className={inputClass}
      />
      <div className="space-y-1">
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSubmit();
            }
          }}
          type="password"
          autoComplete="new-password"
          placeholder="비밀번호 확인"
          className={inputClass}
        />
        {tooShort && <p className="text-xs font-bold text-destructive">6자 이상으로 정해주세요.</p>}
        {mismatch && <p className="text-xs font-bold text-destructive">두 비밀번호가 달라요.</p>}
      </div>

      <button onClick={() => void handleSubmit()} disabled={!valid || busy} className={buttonClass}>
        {busy ? "만드는 중..." : "계정 만들기"}
      </button>

      <p className="break-keep text-center text-[11px] font-bold text-muted-foreground">
        비밀번호를 잊으면 되찾을 방법이 없어요. 꼭 기억해두세요.
        {userId ? ` · 계정 ID ${userId.slice(0, 8)}` : ""}
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 복구용 — 아이디는 있는데 비밀번호가 없는 경우                          */
/* ------------------------------------------------------------------ */

function PasswordOnlyForm({
  username,
  onDone,
}: {
  username: string | null;
  onDone: () => Promise<AccountState>;
}) {
  const [password, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const valid = password.length >= 6 && password === confirm;

  async function handleSubmit() {
    if (!valid || busy) return;
    setBusy(true);
    try {
      await setPassword(password);
      toast.success("비밀번호를 정했어! 이제 로그인할 수 있어.");
      await onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "비밀번호를 정하지 못했어.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card-soft space-y-3 px-5 py-5">
      <div className="space-y-1.5">
        <p className="text-base text-primary">비밀번호만 정하면 끝이에요 🔑</p>
        <p className="break-keep text-sm font-semibold text-muted-foreground">
          아이디 <b className="text-foreground">{username}</b> 는 만들어졌는데 비밀번호가 아직
          없어요.
        </p>
      </div>

      <input
        value={password}
        onChange={(e) => setPw(e.target.value)}
        type="password"
        autoComplete="new-password"
        placeholder="비밀번호 (6자 이상)"
        className={inputClass}
      />
      <input
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void handleSubmit();
          }
        }}
        type="password"
        autoComplete="new-password"
        placeholder="비밀번호 확인"
        className={inputClass}
      />

      <button onClick={() => void handleSubmit()} disabled={!valid || busy} className={buttonClass}>
        {busy ? "저장하는 중..." : "비밀번호 정하기"}
      </button>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 연결 완료                                                            */
/* ------------------------------------------------------------------ */

function LinkedAccount({ username }: { username: string | null }) {
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
        <p className="text-xs font-bold text-muted-foreground">내 아이디</p>
        <p className="truncate text-sm font-black text-foreground">{username ?? "-"}</p>
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
