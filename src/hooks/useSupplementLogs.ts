import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBaby } from "./useBaby";
import { useAuth } from "./useAuth";

export interface SupplementLog {
  id: string;
  baby_id: string;
  item_key: string;
  log_date: string;
}

// Local calendar date (YYYY-MM-DD) — supplement_logs.log_date is a plain date,
// so we key on the user's day, not a UTC instant.
const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Reads which supplements are ticked for a given day and exposes a toggle.
 * A ticked item is a single row; unticking deletes it. Mirrors the realtime /
 * logsVersion sync used by the other log hooks so co-parents stay in step.
 */
export function useSupplementLogs(date: Date) {
  const { currentBaby, logsVersion, bumpLogs, markLocalOp } = useBaby();
  const { user } = useAuth();
  const [rows, setRows] = useState<SupplementLog[]>([]);
  const [loading, setLoading] = useState(true);
  const day = dateKey(date);

  const load = useCallback(async () => {
    if (!currentBaby) { setRows([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("supplement_logs")
      .select("*")
      .eq("baby_id", currentBaby.id)
      .eq("log_date", day);
    setRows((data ?? []) as SupplementLog[]);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBaby, day, logsVersion]);

  useEffect(() => { load(); }, [load]);

  const toggle = useCallback(async (itemKey: string, checked: boolean) => {
    if (!currentBaby || !user) return;
    const existing = rows.find((r) => r.item_key === itemKey);

    if (checked && !existing) {
      // Optimistic insert with a temp id, reconciled with the real id on success.
      const tempId = `temp-${itemKey}`;
      setRows((r) => [...r, { id: tempId, baby_id: currentBaby.id, item_key: itemKey, log_date: day }]);
      const { data, error } = await supabase
        .from("supplement_logs")
        .insert({ baby_id: currentBaby.id, item_key: itemKey, log_date: day, created_by: user.id })
        .select("id")
        .maybeSingle();
      if (error) {
        setRows((r) => r.filter((x) => x.id !== tempId));
        toast.error(error.message);
        return;
      }
      if (data?.id) {
        markLocalOp("supplement_logs", data.id);
        setRows((r) => r.map((x) => (x.id === tempId ? { ...x, id: data.id } : x)));
      }
      bumpLogs();
    } else if (!checked && existing) {
      setRows((r) => r.filter((x) => x.item_key !== itemKey));
      markLocalOp("supplement_logs", existing.id);
      const { error } = await supabase.from("supplement_logs").delete().eq("id", existing.id);
      if (error) { toast.error(error.message); load(); return; }
      bumpLogs();
    }
  }, [currentBaby, user, rows, day, bumpLogs, markLocalOp, load]);

  const checkedKeys = new Set(rows.map((r) => r.item_key));
  return { checkedKeys, toggle, loading };
}
