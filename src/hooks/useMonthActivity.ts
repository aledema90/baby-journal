import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBaby } from "./useBaby";

export interface DayActivity {
  sleep: boolean;
  diaper: boolean;
  feeding: boolean;
}

export function useMonthActivity(month: Date) {
  const { currentBaby, logsVersion } = useBaby();
  const [days, setDays] = useState<Record<string, DayActivity>>({});
  const [loading, setLoading] = useState(true);

  // See useDayLogs for the rationale: stabilise across re-renders so a fresh
  // `new Date()` from a caller doesn't trigger an infinite refetch loop.
  const monthKey = `${month.getFullYear()}-${month.getMonth()}`;

  const load = useCallback(async () => {
    if (!currentBaby) {
      setDays({});
      setLoading(false);
      return;
    }
    setLoading(true);
    const start = new Date(month.getFullYear(), month.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);
    const startIso = start.toISOString();
    const endIso = end.toISOString();

    const [s, d, f] = await Promise.all([
      supabase.from("sleep_logs").select("start_at").eq("baby_id", currentBaby.id).gte("start_at", startIso).lte("start_at", endIso),
      supabase.from("diaper_logs").select("occurred_at").eq("baby_id", currentBaby.id).gte("occurred_at", startIso).lte("occurred_at", endIso),
      supabase.from("feeding_logs").select("start_at").eq("baby_id", currentBaby.id).gte("start_at", startIso).lte("start_at", endIso),
    ]);

    const map: Record<string, DayActivity> = {};
    const key = (iso: string) => {
      const dt = new Date(iso);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      const day = String(dt.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    const ensure = (k: string) => (map[k] ||= { sleep: false, diaper: false, feeding: false });
    (s.data ?? []).forEach((r: any) => { ensure(key(r.start_at)).sleep = true; });
    (d.data ?? []).forEach((r: any) => { ensure(key(r.occurred_at)).diaper = true; });
    (f.data ?? []).forEach((r: any) => { ensure(key(r.start_at)).feeding = true; });

    setDays(map);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBaby, monthKey, logsVersion]);

  useEffect(() => { load(); }, [load]);

  return { days, loading, refresh: load };
}
