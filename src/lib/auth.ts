import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/* ------------------------------------------------------------------ */
/* 세션 부트스트랩                                                       */
/* ------------------------------------------------------------------ */

let bootstrapping: Promise<Session | null> | null = null;

/**
 * 세션이 없으면 익명 세션을 하나 만듭니다.
 *
 * 여러 컴포넌트가 동시에 호출해도 익명 유저가 중복 생성되지 않도록
 * 진행 중인 Promise 를 공유합니다.
 *
 * ⚠️ 로그인 화면처럼 "아직 계정이 없어도 되는" 곳에서는 부르지 마세요.
 *    부르는 순간 새 익명 유저가 생깁니다. 그런 곳에서는 getAccountState() 를 쓰세요.
 */
export function ensureSession(): Promise<Session | null> {
  if (!bootstrapping) {
    bootstrapping = (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) return data.session;

      const { data: anon, error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.error("[auth] 익명 로그인 실패", error);
        return null;
      }
      return anon.session;
    })().finally(() => {
      bootstrapping = null;
    });
  }
  return bootstrapping;
}

/* ------------------------------------------------------------------ */
/* 현재 계정 상태 조회 (세션을 새로 만들지 않음)                           */
/* ------------------------------------------------------------------ */

export type AccountState = {
  userId: string | null;
  email: string | null;
  isAnonymous: boolean;
  hasSession: boolean;
};

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function getAccountState(): Promise<AccountState> {
  const user = await getCurrentUser();
  return {
    userId: user?.id ?? null,
    email: user?.email ?? null,
    isAnonymous: Boolean(user?.is_anonymous),
    hasSession: Boolean(user),
  };
}

export async function isAnonymous(): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user?.is_anonymous);
}

/* ------------------------------------------------------------------ */
/* 익명 계정 → 이메일 계정 승격                                          */
/* ------------------------------------------------------------------ */

export type LinkResult =
  | { status: "linked" }
  | { status: "confirm_email"; email: string };

/**
 * 익명 계정에 이메일·비밀번호를 연결합니다.
 *
 * user id 가 그대로 유지되므로 goals / cheers / comments / profiles 의
 * 기존 데이터는 손대지 않아도 그대로 따라옵니다.
 */
export async function linkEmailToAccount(
  email: string,
  password: string,
): Promise<LinkResult> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("세션을 찾지 못했어. 새로고침하고 다시 해볼래?");
  }
  if (!user.is_anonymous) {
    throw new Error("이 계정에는 이미 이메일이 연결돼 있어.");
  }

  // 1) 비밀번호 먼저.
  //    이메일 확인 메일을 누른 직후 바로 로그인할 수 있게 하기 위해서입니다.
  const { error: pwError } = await supabase.auth.updateUser({ password });
  if (pwError) throw new Error(toKoreanAuthError(pwError.message));

  // 2) 이메일 연결.
  //    "Confirm email" 설정이 켜져 있으면 확인 전까지 is_anonymous 는 true 로 남습니다.
  const { data, error: mailError } = await supabase.auth.updateUser({ email });
  if (mailError) throw new Error(toKoreanAuthError(mailError.message));

  return data.user?.is_anonymous === false
    ? { status: "linked" }
    : { status: "confirm_email", email };
}

/* ------------------------------------------------------------------ */
/* 로그인 / 로그아웃                                                     */
/* ------------------------------------------------------------------ */

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(toKoreanAuthError(error.message));
}

/**
 * 로그아웃.
 *
 * ⚠️ 로그아웃 후에는 반드시 /login 으로 보내세요.
 *    익명 세션을 만드는 화면으로 돌아가면 그 자리에서 새 익명 유저가 생깁니다.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/* ------------------------------------------------------------------ */
/* 에러 메시지 한글화                                                    */
/* ------------------------------------------------------------------ */

function toKoreanAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("already registered") || m.includes("already exists")) {
    return "이미 가입된 이메일이야. 다른 이메일을 쓰거나, 그 계정으로 로그인해줘.";
  }
  if (m.includes("password") && (m.includes("6") || m.includes("short"))) {
    return "비밀번호는 6자 이상이어야 해.";
  }
  if (m.includes("invalid login credentials")) {
    return "이메일이나 비밀번호가 맞지 않아.";
  }
  if (m.includes("email not confirmed")) {
    return "이메일 확인이 아직 안 됐어. 받은 메일의 링크를 눌러줘.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "요청이 너무 잦아. 잠시 뒤에 다시 해볼래?";
  }
  if (m.includes("invalid") && m.includes("email")) {
    return "이메일 형식이 올바르지 않아.";
  }
  return message;
}
