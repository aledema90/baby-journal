import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useBaby } from "@/hooks/useBaby";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

interface Props {
  /** Called after a successful redemption with the new baby_id. */
  onRedeemed?: (babyId: string) => void;
  /** When true, render in a more compact layout (no surrounding heading). */
  compact?: boolean;
}

const RedeemCodeForm = ({ onRedeemed, compact }: Props) => {
  const { refresh } = useBaby();
  const t = useT();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("redeem_invite_code", {
      _code: trimmed,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? t("redeem.invalid"));
      return;
    }
    toast.success(t("redeem.linked"));
    setCode("");
    await refresh();
    if (typeof data === "string") onRedeemed?.(data);
  };

  return (
    <form onSubmit={submit} className={compact ? "space-y-2" : "space-y-3"}>
      <div className="space-y-1.5">
        <Label htmlFor="invite-code">{t("redeem.label")}</Label>
        <Input
          id="invite-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t("redeem.placeholder")}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={12}
          required
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full rounded-full">
        {loading ? t("redeem.verifying") : t("redeem.submit")}
      </Button>
    </form>
  );
};

export default RedeemCodeForm;
