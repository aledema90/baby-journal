import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Droplets, Milk, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SleepLog, DiaperLog, FeedingLog } from "@/hooks/useDayLogs";
import { useBaby } from "@/hooks/useBaby";
import { useT, useDateLocale } from "@/lib/i18n";
import SleepDialog from "./tracking/SleepDialog";
import DiaperDialog from "./tracking/DiaperDialog";
import FeedingDialog from "./tracking/FeedingDialog";

interface Props {
  sleep: SleepLog[];
  diapers: DiaperLog[];
  feedings: FeedingLog[];
  onChange: () => void;
}

type Item =
  | { type: "sleep"; t: number; data: SleepLog }
  | { type: "diaper"; t: number; data: DiaperLog }
  | { type: "feeding"; t: number; data: FeedingLog };

const fmtDur = (ms: number) => {
  const m = Math.round(ms / 60000);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h ? `${h}h ${mm}m` : `${mm}m`;
};

const TimelineList = ({ sleep, diapers, feedings, onChange }: Props) => {
  const { bumpLogs, markLocalOp } = useBaby();
  const t = useT();
  const locale = useDateLocale();
  const [editSleep, setEditSleep] = useState<SleepLog | null>(null);
  const [editDiaper, setEditDiaper] = useState<DiaperLog | null>(null);
  const [editFeeding, setEditFeeding] = useState<FeedingLog | null>(null);

  // Stable sorted merge — avoids rebuilding & re-sorting on every parent render.
  const items = useMemo<Item[]>(
    () =>
      [
        ...sleep.map<Item>((s) => ({ type: "sleep", t: +new Date(s.start_at), data: s })),
        ...diapers.map<Item>((d) => ({ type: "diaper", t: +new Date(d.occurred_at), data: d })),
        ...feedings.map<Item>((f) => ({ type: "feeding", t: +new Date(f.start_at), data: f })),
      ].sort((a, b) => b.t - a.t),
    [sleep, diapers, feedings],
  );

  // Memoise initial props for edit dialogs. The dialogs' open-effect depends on
  // `initial` identity — without this it re-ran on every parent render and
  // wiped any in-progress edits.
  const editSleepInitial = useMemo(
    () => (editSleep ? { start_at: editSleep.start_at, end_at: editSleep.end_at, notes: editSleep.notes } : undefined),
    [editSleep],
  );
  const editDiaperInitial = useMemo(
    () => (editDiaper ? { occurred_at: editDiaper.occurred_at, pee: editDiaper.pee, poo: editDiaper.poo, notes: editDiaper.notes } : undefined),
    [editDiaper],
  );
  const editFeedingInitial = useMemo(
    () =>
      editFeeding
        ? {
            start_at: editFeeding.start_at,
            end_at: editFeeding.end_at,
            feed_type: editFeeding.feed_type,
            breast_side: editFeeding.breast_side,
            formula_ml: editFeeding.formula_ml,
          }
        : undefined,
    [editFeeding],
  );

  const del = async (table: "sleep_logs" | "diaper_logs" | "feeding_logs", id: string) => {
    if (!confirm(t("common.confirm_delete_event"))) return;
    // Mark as local before firing so the realtime echo for this DELETE is
    // suppressed (otherwise we'd refetch twice).
    markLocalOp(table, id);
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("common.deleted"));
    bumpLogs();
    onChange();
  };

  if (!items.length) {
    return (
      <Card className="border-0 shadow-card bg-card/60 p-8 text-center rounded-3xl">
        <p className="text-muted-foreground">{t("timeline.empty")}</p>
        <p className="text-xs text-muted-foreground mt-1">{t("timeline.empty_hint")}</p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {items.map((entry) => {
          const time = format(new Date(entry.t), "HH:mm", { locale });
          if (entry.type === "sleep") {
            const s = entry.data;
            const dur = fmtDur(+new Date(s.end_at) - +new Date(s.start_at));
            return (
              <Card key={`s-${s.id}`} className="border-0 shadow-card p-3 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sleep/50 flex items-center justify-center"><Moon className="w-5 h-5 text-sleep-foreground" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{t("timeline.nap")} · {dur}</div>
                  <div className="text-xs text-muted-foreground">{format(new Date(s.start_at), "HH:mm")} → {format(new Date(s.end_at), "HH:mm")}</div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditSleep(s)}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => del("sleep_logs", s.id)}><Trash2 className="w-4 h-4" /></Button>
              </Card>
            );
          }
          if (entry.type === "diaper") {
            const d = entry.data;
            return (
              <Card key={`d-${d.id}`} className="border-0 shadow-card p-3 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-diaper/50 flex items-center justify-center"><Droplets className="w-5 h-5 text-diaper-foreground" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{t("timeline.diaper")} {d.pee && "💧"} {d.poo && "💩"}</div>
                  <div className="text-xs text-muted-foreground">{time}</div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditDiaper(d)}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => del("diaper_logs", d.id)}><Trash2 className="w-4 h-4" /></Button>
              </Card>
            );
          }
          const f = entry.data;
          const sideLabel = f.breast_side === "left"
            ? t("timeline.breast_left")
            : f.breast_side === "right"
              ? t("timeline.breast_right")
              : t("timeline.breast_both");
          const label = f.feed_type === "breast"
            ? `${t("timeline.breast")}${f.breast_side ? ` (${sideLabel})` : ""}${f.end_at ? ` · ${fmtDur(+new Date(f.end_at) - +new Date(f.start_at))}` : ""}`
            : `${t("timeline.formula")} · ${f.formula_ml}ml`;
          return (
            <Card key={`f-${f.id}`} className="border-0 shadow-card p-3 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-feeding/50 flex items-center justify-center"><Milk className="w-5 h-5 text-feeding-foreground" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{label}</div>
                <div className="text-xs text-muted-foreground">{format(new Date(f.start_at), "HH:mm")}{f.end_at ? ` → ${format(new Date(f.end_at), "HH:mm")}` : ""}</div>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditFeeding(f)}><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => del("feeding_logs", f.id)}><Trash2 className="w-4 h-4" /></Button>
            </Card>
          );
        })}
      </div>

      <SleepDialog
        open={!!editSleep}
        onOpenChange={(o) => !o && setEditSleep(null)}
        editId={editSleep?.id}
        initial={editSleepInitial}
        onSaved={onChange}
      />
      <DiaperDialog
        open={!!editDiaper}
        onOpenChange={(o) => !o && setEditDiaper(null)}
        editId={editDiaper?.id}
        initial={editDiaperInitial}
        onSaved={onChange}
      />
      <FeedingDialog
        open={!!editFeeding}
        onOpenChange={(o) => !o && setEditFeeding(null)}
        editId={editFeeding?.id}
        initial={editFeedingInitial}
        onSaved={onChange}
      />
    </>
  );
};

export default TimelineList;
