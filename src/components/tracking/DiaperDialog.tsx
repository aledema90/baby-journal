import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  initial?: { occurred_at: string; pee: boolean; poo: boolean; notes?: string | null };
  onSaved?: () => void;
}

const DiaperDialog = ({ open, onOpenChange, editId, initial, onSaved }: Props) => {
  const t = useT();
  const { currentBaby, bumpLogs, markLocalOp } = useBaby();
  const { user } = useAuth();
  const [when, setWhen] = useState(nowLocal());
  const [pee, setPee] = useState(true);
  const [poo, setPoo] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    if (open) {
      if (initial) {
        setWhen(isoToLocal(initial.occurred_at));
        setPee(initial.pee); setPoo(initial.poo);
        setNotes(initial.notes ?? "");
      } else {
        setWhen(nowLocal()); setPee(true); setPoo(false);
        setNotes("");
      }
    }
  }, [open, initial]);

  const save = async () => {
    if (!currentBaby || !user) return;
    if (!pee && !poo) { toast.error(t("diaper.choose_type")); return; }
    setSaving(true);
    const payload = {
      baby_id: currentBaby.id,
      occurred_at: localToIso(when),
      pee, poo,
      notes: notes.trim() || null,
      created_by: user.id,
    };
    // Close the modal first so the save feels instant; network happens in the
    // background. On error we surface a toast and let the user retry.
    onOpenChange(false);
    setSaving(false);
    toast.success(t("diaper.saved"));
    const { data, error } = editId
      ? await supabase.from("diaper_logs").update(payload).eq("id", editId).select("id").maybeSingle()
      : await supabase.from("diaper_logs").insert(payload).select("id").maybeSingle();
    if (error) { toast.error(error.message); return; }
    if (data?.id) markLocalOp("diaper_logs", data.id);
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
        <DialogHeader><DialogTitle className="font-display">{t("diaper.title")}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("diaper.when")}</Label>
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div className="flex gap-6 py-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={pee} onCheckedChange={(v) => setPee(!!v)} />
              <span>{t("diaper.pee")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={poo} onCheckedChange={(v) => setPoo(!!v)} />
              <span>{t("diaper.poo")}</span>
            </label>
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

export default DiaperDialog;
