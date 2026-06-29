import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type LogTable = "sleep_logs" | "diaper_logs" | "feeding_logs" | "weight_logs" | "supplement_logs";

export interface Baby {
  id: string;
  name: string;
  birth_date: string;
  gender: string | null;
  photo_url: string | null;
  created_by: string;
}

interface BabyContextValue {
  babies: Baby[];
  currentBaby: Baby | null;
  setCurrentBaby: (b: Baby) => void;
  loading: boolean;
  refresh: () => Promise<void>;
  /** Incremented whenever a tracking log is created / updated / deleted. Hooks
   *  that read sleep/diaper/feeding logs should include this in their effect
   *  deps so they refetch automatically. */
  logsVersion: number;
  /** Call after a successful insert/update/delete on any *_logs table. */
  bumpLogs: () => void;
  /** Mark a row mutation as originating locally so the realtime echo for the
   *  same row is ignored (prevents a double refetch on save). */
  markLocalOp: (table: LogTable, id: string) => void;
}

const BabyContext = createContext<BabyContextValue>({
  babies: [],
  currentBaby: null,
  setCurrentBaby: () => {},
  loading: true,
  refresh: async () => {},
  logsVersion: 0,
  bumpLogs: () => {},
  markLocalOp: () => {},
});

/** Realtime echoes can lag by hundreds of ms. We expire local-op markers so the
 *  set can never grow unbounded if the echo for some reason never arrives. */
const LOCAL_OP_TTL_MS = 5000;

export const BabyProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [babies, setBabies] = useState<Baby[]>([]);
  const [currentBaby, setCurrentBabyState] = useState<Baby | null>(null);
  const [loading, setLoading] = useState(true);
  const [logsVersion, setLogsVersion] = useState(0);
  const bumpLogs = useCallback(() => setLogsVersion((v) => v + 1), []);

  // Tracks "<table>:<id>" → timestamp for rows we just mutated locally. The
  // postgres_changes subscription fires for our own writes too, which would
  // otherwise double-trigger refetches right after a save.
  const localOpsRef = useRef<Map<string, number>>(new Map());
  const markLocalOp = useCallback((table: LogTable, id: string) => {
    localOpsRef.current.set(`${table}:${id}`, Date.now());
  }, []);
  const consumeLocalOp = useCallback((table: LogTable, id: string | undefined) => {
    if (!id) return false;
    const key = `${table}:${id}`;
    const ts = localOpsRef.current.get(key);
    if (ts === undefined) return false;
    localOpsRef.current.delete(key);
    // Reject ancient entries — if anything goes wrong they shouldn't shadow a
    // real co-parent edit indefinitely.
    return Date.now() - ts < LOCAL_OP_TTL_MS;
  }, []);

  const refresh = useCallback(async () => {
    // Wait for auth to resolve before deciding anything. Otherwise on a fresh
    // page load we'd briefly report `loading: false, babies: []` for a
    // logged-in user, and RequireBaby would redirect to /onboarding before the
    // real fetch runs.
    if (authLoading) return;
    if (!user) {
      setBabies([]);
      setCurrentBabyState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from("babies").select("*").order("created_at", { ascending: true });
    const list = (data ?? []) as Baby[];
    setBabies(list);
    setCurrentBabyState((cur) => {
      if (cur && list.find((b) => b.id === cur.id)) return cur;
      return list[0] ?? null;
    });
    setLoading(false);
  }, [user, authLoading]);

  useEffect(() => { refresh(); }, [refresh]);

  // Live-sync log changes for the current baby across co-parents. Whenever
  // another device inserts/updates/deletes a sleep/diaper/feeding log for the
  // selected baby, bump the version so useDayLogs / useMonthActivity refetch.
  useEffect(() => {
    if (!currentBaby) return;
    const babyId = currentBaby.id;
    const handle = (table: LogTable) => (payload: { new?: { id?: string }; old?: { id?: string } }) => {
      const id = payload.new?.id ?? payload.old?.id;
      // Skip the echo of the local user's own write — they already bumped.
      if (consumeLocalOp(table, id)) return;
      bumpLogs();
    };
    const channel = supabase
      .channel(`baby:${babyId}:logs`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sleep_logs", filter: `baby_id=eq.${babyId}` },
        handle("sleep_logs") as never,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "diaper_logs", filter: `baby_id=eq.${babyId}` },
        handle("diaper_logs") as never,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feeding_logs", filter: `baby_id=eq.${babyId}` },
        handle("feeding_logs") as never,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "weight_logs", filter: `baby_id=eq.${babyId}` },
        handle("weight_logs") as never,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "supplement_logs", filter: `baby_id=eq.${babyId}` },
        handle("supplement_logs") as never,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentBaby?.id, bumpLogs, consumeLocalOp]);

  const setCurrentBaby = (b: Baby) => setCurrentBabyState(b);

  return (
    <BabyContext.Provider value={{ babies, currentBaby, setCurrentBaby, loading, refresh, logsVersion, bumpLogs, markLocalOp }}>
      {children}
    </BabyContext.Provider>
  );
};

export const useBaby = () => useContext(BabyContext);
