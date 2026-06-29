import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBaby } from "./useBaby";

export interface SleepLog { id: string; baby_id: string; start_at: string; end_at: string; notes: string | null; }
export interface DiaperLog { id: string; baby_id: string; occurred_at: string; pee: boolean; poo: boolean; notes: string | null; }
export interface FeedingLog { id: string; baby_id: string; start_at: string; end_at: string | null; feed_type: "breast" | "formula"; breast_side: string | null; formula_ml: number | null; notes: string | null; }

export function useDayLogs(date: Date) {
  const { currentBaby, logsVersion } = useBaby();
  const [sleep, setSleep] = useState<SleepLog[]>([]);
  const [diapers, setDiapers] = useState<DiaperLog[]>([]);
  const [feedings, setFeedings] = useState<FeedingLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Stabilise the date dep across renders. Callers (notably Today.tsx) can
  // pass a fresh `new Date()` on every render, which would otherwise change
  // `load`'s identity each render and produce an infinite refetch loop.
  const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

  const load = useCallback(async () => {
    if (!currentBaby) { setLoading(false); return; }
    setLoading(true);
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(date); end.setHours(23, 59, 59, 999);
    const startIso = start.toISOString();
    const endIso = end.toISOString();
    const [s, d, f] = await Promise.all([
      supabase.from("sleep_logs").select("*").eq("baby_id", currentBaby.id).gte("start_at", startIso).lte("start_at", endIso).order("start_at", { ascending: false }),
      supabase.from("diaper_logs").select("*").eq("baby_id", currentBaby.id).gte("occurred_at", startIso).lte("occurred_at", endIso).order("occurred_at", { ascending: false }),
      supabase.from("feeding_logs").select("*").eq("baby_id", currentBaby.id).gte("start_at", startIso).lte("start_at", endIso).order("start_at", { ascending: false }),
    ]);
    setSleep((s.data ?? []) as SleepLog[]);
    setDiapers((d.data ?? []) as DiaperLog[]);
    setFeedings((f.data ?? []) as FeedingLog[]);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBaby, dayKey, logsVersion]);

  useEffect(() => { load(); }, [load]);

  return { sleep, diapers, feedings, loading, refresh: load };
}
