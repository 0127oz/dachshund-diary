import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * 타입 검사를 우회한 Supabase 클라이언트.
 *
 * Lovable 이 자동 생성하는 src/integrations/supabase/types.ts 에는
 * SQL editor 로 직접 만든 comments / cheers 테이블과 goals.is_public 컬럼이
 * 아직 들어있지 않습니다. 그대로 supabase 를 쓰면 빌드가 실패하므로,
 * 새 테이블을 다루는 곳에서는 이 db 를 씁니다.
 *
 * 나중에 types.ts 가 갱신되면(Lovable 에게 한 번 시키면 됩니다)
 * 이 파일을 지우고 supabase 를 직접 써도 됩니다.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as unknown as SupabaseClient<any>;
