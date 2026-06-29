import { useEffect, useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBaby } from "@/hooks/useBaby";
import { format, parseISO } from "date-fns";
import { useT, useDateLocale } from "@/lib/i18n";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import WeightDialog from "@/components/tracking/WeightDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface WeightLog {
  id: string;
  measured_on: string;
  weight_g: number;
  notes: string | null;
}

type Unit = "g" | "kg";

const fmtWeight = (g: number, unit: Unit) =>
  unit === "kg" ? `${(g / 1000).toFixed(2)} kg` : `${g} g`;

const Weight = () => {
  const t = useT();
  const locale = useDateLocale();
  const { currentBaby, logsVersion, bumpLogs, markLocalOp } = useBaby();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [unit, setUnit] = useState<Unit>("g");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<WeightLog | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<WeightLog | null>(null);

  const load = useCallback(async () => {
    if (!currentBaby) return;
    const { data } = await supabase
      .from("weight_logs")
      .select("id, measured_on, weight_g, notes")
      .eq("baby_id", currentBaby.id)
      .order("measured_on", { ascending: true });
    setLogs((data ?? []) as WeightLog[]);
  }, [currentBaby]);

  useEffect(() => { load(); }, [load, logsVersion]);

  const chartData = useMemo(
    () =>
      logs.map((l) => ({
        date: l.measured_on,
        value: unit === "kg" ? +(l.weight_g / 1000).toFixed(3) : l.weight_g,
      })),
    [logs, unit],
  );

  const reversed = useMemo(() => [...logs].reverse(), [logs]);

  const remove = async () => {
    if (!confirmDelete) return;
    // Mark as local before firing so the realtime echo for this DELETE is
    // suppressed (otherwise we'd refetch twice).
    markLocalOp("weight_logs", confirmDelete.id);
    const { error } = await supabase.from("weight_logs").delete().eq("id", confirmDelete.id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("common.deleted"));
    setConfirmDelete(null);
    bumpLogs();
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">{t("weight.heading")}</h2>
        <div className="flex items-center gap-2">
          <div className="flex bg-card rounded-full p-0.5 shadow-card">
            <Toggle
              pressed={unit === "g"}
              onPressedChange={() => setUnit("g")}
              size="sm"
              className="rounded-full text-xs h-7 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              g
            </Toggle>
            <Toggle
              pressed={unit === "kg"}
              onPressedChange={() => setUnit("kg")}
              size="sm"
              className="rounded-full text-xs h-7 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              kg
            </Toggle>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)} className="rounded-full">
            <Plus className="w-4 h-4 mr-1" /> {t("common.add")}
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-card bg-card/80 backdrop-blur p-4 rounded-3xl">
        {logs.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
            {t("weight.no_data")}
          </div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => format(parseISO(d), "d MMM", { locale })}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  width={45}
                  tick={{ fontSize: 11 }}
                  domain={["auto", "auto"]}
                  tickFormatter={(v: number) => (unit === "kg" ? v.toFixed(2) : String(v))}
                />
                <Tooltip
                  formatter={(v: number) => [unit === "kg" ? `${v.toFixed(3)} kg` : `${v} g`, t("weight.weight")]}
                  labelFormatter={(d: string) => format(parseISO(d), "d MMM yyyy", { locale })}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="border-0 shadow-card bg-card/80 backdrop-blur rounded-3xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
          <span>{t("weight.col_date")}</span>
          <span className="text-right">{t("weight.col_weight")}</span>
          <span className="w-16 text-right">{t("weight.col_actions")}</span>
        </div>
        {reversed.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">{t("weight.empty_records")}</div>
        ) : (
          reversed.map((l) => (
            <div key={l.id} className="grid grid-cols-[1fr_auto_auto] gap-3 items-start px-4 py-3 border-b border-border last:border-0">
              <div>
                <div className="text-sm font-medium capitalize">{format(parseISO(l.measured_on), "EEE d MMM yyyy", { locale })}</div>
                {l.notes && <div className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">{l.notes}</div>}
              </div>
              <div className="text-sm font-medium tabular-nums text-right">{fmtWeight(l.weight_g, unit)}</div>
              <div className="flex gap-1 justify-end w-16">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(l)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setConfirmDelete(l)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>

      <WeightDialog open={addOpen} onOpenChange={setAddOpen} defaultUnit={unit} />
      <WeightDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        editId={editing?.id}
        initial={editing ? { measured_on: editing.measured_on, weight_g: editing.weight_g, notes: editing.notes } : undefined}
        defaultUnit={unit}
      />
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("weight.confirm_delete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("weight.confirm_delete_body")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Weight;
