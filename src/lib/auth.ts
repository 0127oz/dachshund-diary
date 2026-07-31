import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/* ------------------------------------------------------------------ */
/* 아이디 ↔ 내부 이메일 변환                                             */
/* ------------------------------------------------------------------ */

/**
 * Supabase Auth 는 이메일 또는 전화번호를 요구합니다.
 * 이 앱은 아이디/비밀번호만 쓰므로, 아이디에 가짜 도메인을 붙여
 * 내부적으로만 이메일처럼 다룹니다. 사용자에게는 보이지 않습니다.
 *
 * example.com 은 RFC 2606 이 예약한 도메인이라 실제 메일이 나갈 일이 없습니다.
 *
 * ⚠️ 이 값을 나중에 바꾸면 기존 계정으로 로그인할 수 없게 됩니다. 고정하세요.
 */
const USERNAME_DOMAIN = "dachshund.example.com";

const USERNAME_RE = /^[a-z0-9_]{2,20}$/;

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

/** 아이디 형식 검사. 통과하면 null, 아니면 사람이 읽을 오류 문구 */
export function validateUsername(input: string): string | null {
  const name = normalizeUsername(input);
  if (name.length < 2) return "아이디는 2자 이상이어야 해.";
  if (name.length > 20) return "아이디는 20자까지야.";
  if (!USERNAME_RE.test(name)) return "아이디는 영문 소문자, 숫자, _ 만 쓸 수 있어.";
  return null;
}

export function usernameToEmail(input: string): string {
  return `${normalizeUsername(input)}@${USERNAME_DOMAIN}`;
}

export function emailToUsername(email: string | null | undefined): string | null {
  if (!email) return null;
  const [local, domain] = email.split("@");
  return domain === USERNAME_DOMAIN ? local : email;
}

/* ------------------------------------------------------------------ */
/* 세션 부트스트랩                                                       */
/* ------------------------------------------------------------------ */

let bootstrapping: Promise<Session | null> | null = null;

/**
 * 세션이 없으면 익명 세션을 하나 만듭니다.
 *
 * 여러 곳에서 동시에 호출해도 익명 유저가 중복 생성되지 않도록
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
/* 계정 상태                                                            */
/* ------------------------------------------------------------------ */

export type AccountState = {
  userId: string | null;
  username: string | null;
  isAnonymous: boolean;
  passwordSet: boolean;
  hasSession: boolean;
};

/**
 *  link          익명 계정. 아이디/비밀번호를 정하면 됨
 *  set_password  아이디는 붙었는데 비밀번호가 없음 (중간에 실패한 경우의 복구용)
 *  done          연결 완료
 */
export type LinkStage = "link" | "set_password" | "done";

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function getAccountState(): Promise<AccountState> {
  const user = await getCurrentUser();
  return {
    userId: user?.id ?? null,
    username: emailToUsername(user?.email),
    isAnonymous: Boolean(user?.is_anonymous),
    passwordSet: user?.user_metadata?.password_set === true,
    hasSession: Boolean(user),
  };
}

export function stageOf(state: AccountState): LinkStage {
  if (state.isAnonymous) return "link";
  return state.passwordSet ? "done" : "set_password";
}

export async function isAnonymous(): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user?.is_anonymous);
}

/* ------------------------------------------------------------------ */
/* 계정 연결 — 아이디 + 비밀번호                                         */
/* ------------------------------------------------------------------ */

/**
 * 익명 계정에 아이디와 비밀번호를 붙입니다.
 *
 * user id 가 그대로 유지되므로 goals / cheers / comments / profiles 는
 * 손대지 않아도 그대로 따라옵니다.
 *
 * ⚠️ 두 번에 나눠 호출합니다.
 *    Supabase 는 익명 계정에 이메일이 붙기 전에는 비밀번호 설정을 거부하기 때문에,
 *    아이디(=내부 이메일)를 먼저 확정한 뒤 비밀번호를 넣어야 합니다.
 *
 * ⚠️ 사전 조건: Supabase 의 "Confirm email" 설정이 꺼져 있어야 합니다.
 *    켜져 있으면 첫 단계에서 확인 대기 상태로 멈춥니다.
 */
export async function linkAccount(username: string, password: string): Promise<void> {
  const invalid = validateUsername(username);
  if (invalid) throw new Error(invalid);
  if (password.length < 6) throw new Error("비밀번호는 6자 이상이어야 해.");

  const user = await getCurrentUser();
  if (!user) throw new Error("세션을 찾지 못했어. 새로고침하고 다시 해볼래?");
  if (!user.is_anonymous) throw new Error("이 계정에는 이미 아이디가 연결돼 있어.");

  const name = normalizeUsername(username);

  // 1) 아이디 확정 — 이 시점에 익명 상태가 풀립니다
  const { error: idError } = await supabase.auth.updateUser({
    email: usernameToEmail(name),
  });
  if (idError) throw new Error(toKoreanAuthError(idError.message));

  // 2) 비밀번호 설정
  await setPassword(password);
}

/** 비밀번호만 설정/변경 */
export async function setPassword(password: string): Promise<void> {
  if (password.length < 6) throw new Error("비밀번호는 6자 이상이어야 해.");

  const user = await getCurrentUser();
  if (!user) throw new Error("세션을 찾지 못했어. 새로고침하고 다시 해볼래?");
  if (!user.email) throw new Error("아이디를 먼저 정해줘.");

  const { error } = await supabase.auth.updateUser({
    password,
    // 비밀번호를 정했는지 표시해 둡니다 (Supabase 가 따로 알려주지 않아요)
    data: { password_set: true, username: emailToUsername(user.email) },
  });
  if (error) throw new Error(toKoreanAuthError(error.message));
}

/* ------------------------------------------------------------------ */
/* 로그인 / 로그아웃                                                     */
/* ------------------------------------------------------------------ */

export async function signIn(username: string, password: string): Promise<void> {
  const invalid = validateUsername(username);
  if (invalid) throw new Error("아이디나 비밀번호가 맞지 않아.");

  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });
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

  if (m.includes("anonymous") && m.includes("password")) {
    return "아이디를 먼저 정해야 비밀번호를 설정할 수 있어.";
  }
  if (m.includes("already registered") || m.includes("already exists")) {
    return "이미 쓰고 있는 아이디야. 다른 걸로 정해줄래?";
  }
  if (m.includes("password") && (m.includes("6") || m.includes("short"))) {
    return "비밀번호는 6자 이상이어야 해.";
  }
  if (m.includes("invalid login credentials")) {
    return "아이디나 비밀번호가 맞지 않아.";
  }
  if (m.includes("email not confirmed")) {
    // Confirm email 설정이 켜져 있을 때 나옵니다
    return "계정 설정이 아직 안 끝났어. 관리자에게 알려줘! (Confirm email 설정)";
  }
  if (m.includes("rate limit") || m.includes("too many") || m.includes("for security")) {
    return "요청이 너무 잦아. 잠시 뒤에 다시 해볼래?";
  }
  return message;
}
