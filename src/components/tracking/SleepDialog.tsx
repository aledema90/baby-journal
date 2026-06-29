import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { useBaby } from "@/hooks/useBaby";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { nowLocal, localToIso, isoToLocal } from "@/lib/datetime";
import { useT } from "@/lib/i18n";
import ConfirmDiscard from "./ConfirmDiscard";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editId?: string;
  initial?: { start_at: string; end_at: string; notes?: string | null };
  onSaved?: () => void;
}

const SleepDialog = ({ open, onOpenChange, editId, initial, onSaved }: Props) => {
  const t = useT();
  const { currentBaby, bumpLogs, markLocalOp } = useBaby();
  const { user } = useAuth();
  const [start, setStart] = useState(nowLocal());
  const [end, setEnd] = useState(nowLocal());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    if (open) {
      if (initial) {
        setStart(isoToLocal(initial.start_at));
        setEnd(isoToLocal(initial.end_at));
        setNotes(initial.notes ?? "");
      } else {
        const s = new Date(); s.setHours(s.getHours() - 1);
        const sLocal = new Date(s.getTime() - s.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setStart(sLocal);
        setEnd(nowLocal());
        setNotes("");
      }
    }
  }, [open, initial]);

  const save = async () => {
    if (!currentBaby || !user) return;
    if (new Date(end) <= new Date(start)) {
      toast.error(t("sleep.invalid_range"));
      return;
    }
    setSaving(true);
    const payload = {
      baby_id: currentBaby.id,
      start_at: localToIso(start),
      end_at: localToIso(end),
      notes: notes.trim() || null,
      created_by: user.id,
    };
    // Close the modal first so the save feels instant; network happens in the
    // background. On error we surface a toast and let the user retry.
    onOpenChange(false);
    setSaving(false);
    toast.success(t("sleep.saved"));
    const { data, error } = editId
      ? await supabase.from("sleep_logs").update(payload).eq("id", editId).select("id").maybeSingle()
      : await supabase.from("sleep_logs").insert(payload).select("id").maybeSingle();
    if (error) { toast.error(error.message); return; }
    if (data?.id) markLocalOp("sleep_logs", data.id);
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
        <DialogHeader><DialogTitle className="font-display">{t("sleep.title")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("common.start")}</Label>
            <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("common.end")}</Label>
            <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("common.notes_optional")}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} rows={2} />
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

export default SleepDialog;
