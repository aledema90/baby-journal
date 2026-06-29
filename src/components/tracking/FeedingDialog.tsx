import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  initial?: {
    start_at: string; end_at: string | null;
    feed_type: "breast" | "formula";
    breast_side: string | null; formula_ml: number | null;
  };
  onSaved?: () => void;
}

const FeedingDialog = ({ open, onOpenChange, editId, initial, onSaved }: Props) => {
  const t = useT();
  const { currentBaby, bumpLogs, markLocalOp } = useBaby();
  const { user } = useAuth();
  const [when, setWhen] = useState(nowLocal());
  const [ml, setMl] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    if (open) {
      if (initial) {
        setWhen(isoToLocal(initial.start_at));
        setMl(initial.formula_ml?.toString() ?? "");
      } else {
        setWhen(nowLocal()); setMl("");
      }
    }
  }, [open, initial]);

  const save = async () => {
    if (!currentBaby || !user) return;
    if (!ml || Number(ml) <= 0) { toast.error(t("feeding.missing_ml")); return; }
    setSaving(true);
    const iso = localToIso(when);
    const payload = {
      baby_id: currentBaby.id,
      start_at: iso,
      end_at: iso,
      feed_type: "formula" as const,
      breast_side: null,
      formula_ml: Number(ml),
      created_by: user.id,
    };
    // Close the modal first so the save feels instant; network happens in the
    // background. On error we surface a toast and let the user retry.
    onOpenChange(false);
    setSaving(false);
    toast.success(t("feeding.saved"));
    const { data, error } = editId
      ? await supabase.from("feeding_logs").update(payload).eq("id", editId).select("id").maybeSingle()
      : await supabase.from("feeding_logs").insert(payload).select("id").maybeSingle();
    if (error) { toast.error(error.message); return; }
    if (data?.id) markLocalOp("feeding_logs", data.id);
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
        <DialogHeader><DialogTitle className="font-display">{t("feeding.title")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("common.when")}</Label>
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("feeding.amount")}</Label>
            <Input type="number" min={1} max={1000} value={ml} onChange={(e) => setMl(e.target.value)} placeholder={t("feeding.amount_placeholder")} autoFocus />
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

export default FeedingDialog;
