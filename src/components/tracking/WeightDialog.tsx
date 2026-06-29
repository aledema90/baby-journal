import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { useEffect, useState } from "react";
import { useBaby } from "@/hooks/useBaby";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useT } from "@/lib/i18n";
import ConfirmDiscard from "./ConfirmDiscard";

type Unit = "g" | "kg";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editId?: string;
  initial?: { measured_on: string; weight_g: number; notes: string | null };
  defaultUnit?: Unit;
  onSaved?: () => void;
}

const todayLocal = () => format(new Date(), "yyyy-MM-dd");

const WeightDialog = ({ open, onOpenChange, editId, initial, defaultUnit = "g", onSaved }: Props) => {
  const t = useT();
  const { currentBaby, bumpLogs, markLocalOp } = useBaby();
  const { user } = useAuth();
  const [date, setDate] = useState(todayLocal());
  const [unit, setUnit] = useState<Unit>(defaultUnit);
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setDate(initial.measured_on);
      setUnit(defaultUnit);
      setValue(defaultUnit === "kg" ? (initial.weight_g / 1000).toString() : initial.weight_g.toString());
      setNotes(initial.notes ?? "");
    } else {
      setDate(todayLocal());
      setUnit(defaultUnit);
      setValue("");
      setNotes("");
    }
  }, [open, initial, defaultUnit]);

  const save = async () => {
    if (!currentBaby || !user) return;
    const num = parseFloat(value.replace(",", "."));
    if (!Number.isFinite(num) || num <= 0) {
      toast.error(t("weight.invalid"));
      return;
    }
    const weight_g = Math.round(unit === "kg" ? num * 1000 : num);
    setSaving(true);
    const payload = {
      baby_id: currentBaby.id,
      measured_on: date,
      weight_g,
      notes: notes.trim() || null,
      created_by: user.id,
    };
    // Close the modal first so the save feels instant; network happens in the
    // background. On error we surface a toast and let the user retry.
    onOpenChange(false);
    setSaving(false);
    toast.success(t("weight.saved"));
    const { data, error } = editId
      ? await supabase.from("weight_logs").update(payload).eq("id", editId).select("id").maybeSingle()
      : await supabase.from("weight_logs").insert(payload).select("id").maybeSingle();
    if (error) { toast.error(error.message); return; }
    if (data?.id) markLocalOp("weight_logs", data.id);
    bumpLogs();
    onSaved?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : setConfirmClose(true))}>
      <DialogContent
        className="rounded-3xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader><DialogTitle className="font-display">{t("weight.title")}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("weight.date")}</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>{t("weight.weight")}</Label>
              <div className="flex bg-muted rounded-full p-0.5">
                <Toggle
                  pressed={unit === "g"}
                  onPressedChange={() => {
                    if (unit === "g") return;
                    const num = parseFloat(value.replace(",", "."));
                    if (Number.isFinite(num)) setValue(Math.round(num * 1000).toString());
                    setUnit("g");
                  }}
                  size="sm"
                  className="rounded-full text-xs h-7 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  g
                </Toggle>
                <Toggle
                  pressed={unit === "kg"}
                  onPressedChange={() => {
                    if (unit === "kg") return;
                    const num = parseFloat(value.replace(",", "."));
                    if (Number.isFinite(num)) setValue((num / 1000).toString());
                    setUnit("kg");
                  }}
                  size="sm"
                  className="rounded-full text-xs h-7 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  kg
                </Toggle>
              </div>
            </div>
            <Input
              type="number"
              inputMode="decimal"
              step={unit === "kg" ? "0.01" : "1"}
              placeholder={unit === "kg" ? "3.45" : "3450"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("common.notes")}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("weight.notes_placeholder")} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setConfirmClose(true)} className="rounded-full">{t("common.cancel")}</Button>
          <Button onClick={save} disabled={saving} className="rounded-full">{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
      <ConfirmDiscard
        open={confirmClose}
        onOpenChange={setConfirmClose}
        onDiscard={() => { setConfirmClose(false); onOpenChange(false); }}
      />
    </Dialog>
  );
};

export default WeightDialog;
