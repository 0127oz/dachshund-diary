import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAccountState, signIn } from "@/lib/auth";
import { Dachshund } from "@/components/Dachshund";

export const Route = createFileRoute("/login")({ component: LoginPage });

const inputClass =
  "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring";

function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // 이 브라우저에 아직 연결 안 된 익명 기록이 남아 있는지 확인합니다.
  // ⚠️ 여기서는 ensureSession() 을 부르지 않습니다. 부르면 새 익명 유저가 생겨요.
  const [pendingNickname, setPendingNickname] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const state = await getAccountState();
      if (!active || !state.isAnonymous || !state.userId) return;

      const { data } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", state.userId)
        .maybeSingle();

      if (active && data?.nickname) setPendingNickname(data.nickname as string);
    })();
    return () => {
      active = false;
    };
  }, []);

  const needsWarning = Boolean(pendingNickname) && !acknowledged;
  const canSubmit = username.trim().length > 0 && password.length > 0 && !busy && !needsWarning;

  async function handleSubmit() {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await signIn(username, password);
      toast.success("돌아온 걸 환영해!");
      void navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "로그인하지 못했어. 다시 해볼래?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex flex-col items-center text-center">
          <Dachshund mood="happy" size={140} />
          <h1 className="mt-3 text-xl text-primary">응지의 목표수첩</h1>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            아이디와 비밀번호로 로그인해주세요
          </p>
        </div>

        {needsWarning && (
          <section className="card-soft space-y-2 px-5 py-4">
            <p className="break-keep text-sm font-semibold text-foreground">
              이 브라우저에 <b className="text-primary">{pendingNickname}</b> 님의 기록이 남아
              있어요. 다른 계정으로 로그인하면 이 기록은 더 이상 보이지 않아요.
            </p>
            <p className="break-keep text-sm font-semibold text-muted-foreground">
              기록을 지키려면{" "}
              <Link to="/me" className="text-primary underline">
                마이페이지에서 계정 만들기
              </Link>
              를 먼저 해주세요.
            </p>
            <button
              onClick={() => setAcknowledged(true)}
              className="text-xs font-black text-muted-foreground underline"
            >
              괜찮아요, 다른 계정으로 로그인할게요
            </button>
          </section>
        )}

        <section className="card-soft space-y-3 px-5 py-5">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="아이디"
            className={inputClass}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSubmit();
              }
            }}
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호"
            className={inputClass}
          />
          <button
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-black text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? "로그인하는 중..." : "로그인"}
          </button>
        </section>

        <p className="text-center text-xs font-bold text-muted-foreground">
          아직 계정이 없다면{" "}
          <Link to="/" className="text-primary underline">
            바로 시작하기
          </Link>
        </p>
      </div>
    </div>
  );
}
