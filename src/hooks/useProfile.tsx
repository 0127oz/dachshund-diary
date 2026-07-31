import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  nickname: string;
  created_at: string;
}

export function useProfile() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // 응답이 순서 없이 도착해도 오래된 결과가 최신 상태를 덮어쓰지 않게 합니다.
  // (온보딩에서 프로필을 만드는 순간 SIGNED_IN 이벤트와 겹칩니다)
  const seqRef = useRef(0);
  const activeRef = useRef(true);

  const load = useCallback(async (uid: string | null, anon: boolean) => {
    const seq = ++seqRef.current;
    const isStale = () => !activeRef.current || seq !== seqRef.current;

    if (isStale()) return;
    setIsAnonymous(anon);

    if (!uid) {
      setUserId(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();

    if (isStale()) return;
    setUserId(uid);
    setProfile((data as Profile) ?? null);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    await load(data.user?.id ?? null, Boolean(data.user?.is_anonymous));
  }, [load]);

  useEffect(() => {
    activeRef.current = true;

    // ⚠️ 여기서 세션을 만들지 않습니다.
    //    익명 계정은 온보딩에서 닉네임을 확정할 때만 생겨야 합니다.
    void refresh();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        // onAuthStateChange 콜백 안에서 곧바로 supabase 를 await 하면
        // 내부 락 때문에 간헐적으로 멈춥니다. 콜백 밖으로 빼서 실행합니다.
        queueMicrotask(() => {
          void load(session?.user?.id ?? null, Boolean(session?.user?.is_anonymous));
        });
      }
    });

    return () => {
      activeRef.current = false;
      sub.subscription.unsubscribe();
    };
  }, [load, refresh]);

  return { loading, userId, profile, setProfile, isAnonymous, refresh };
}
