import { useEffect, useState } from "react";
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

  useEffect(() => {
    let active = true;

    async function load(uid: string | null) {
      if (!uid) {
        if (!active) return;
        setUserId(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (!active) return;
      setUserId(uid);
      setProfile((data as Profile) ?? null);
      setLoading(false);
    }

    supabase.auth.getUser().then(({ data }) => load(data.user?.id ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        load(session?.user?.id ?? null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { loading, userId, profile, setProfile };
}