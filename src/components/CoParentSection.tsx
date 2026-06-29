import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { useT, useDateLocale } from "@/lib/i18n";

interface InviteCode {
  id: string;
  code: string;
  expires_at: string;
  created_at: string;
  used_by: string | null;
  used_at: string | null;
}

interface Props {
  babyId: string;
  babyName: string;
}

const generateNumericCode = () => String(Math.floor(100000 + Math.random() * 900000));

const CoParentSection = ({ babyId, babyName }: Props) => {
  const { user } = useAuth();
  const t = useT();
  const locale = useDateLocale();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [parentsCount, setParentsCount] = useState(1);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    const [{ data: codeRows }, { count }] = await Promise.all([
      supabase
        .from("invite_codes")
        .select("id, code, expires_at, created_at, used_by, used_at")
        .eq("baby_id", babyId)
        .is("used_by", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }),
      supabase
        .from("baby_parents")
        .select("parent_id", { count: "exact", head: true })
        .eq("baby_id", babyId),
    ]);
    setCodes((codeRows ?? []) as InviteCode[]);
    setParentsCount(count ?? 1);
  }, [babyId]);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    if (!user) return;
    setGenerating(true);
    // Retry on rare unique-collision (23505) up to 5 times.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateNumericCode();
      const { error } = await supabase
        .from("invite_codes")
        .insert({ code, baby_id: babyId, created_by: user.id });
      if (!error) {
        toast.success(t("coparent.code_generated"));
        await load();
        setGenerating(false);
        return;
      }
      if (error.code !== "23505") {
        toast.error(error.message);
        setGenerating(false);
        return;
      }
    }
    toast.error(t("coparent.cant_generate"));
    setGenerating(false);
  };

  const revoke = async (id: string) => {
    if (!confirm(t("coparent.revoke_confirm"))) return;
    const { error } = await supabase.from("invite_codes").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("coparent.revoked"));
    await load();
  };

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(t("coparent.code_copied"));
    } catch {
      toast.error(t("coparent.copy_failed"));
    }
  };

  const share = async (code: string) => {
    if (!navigator.share) return copy(code);
    try {
      await navigator.share({
        title: t("coparent.share_title"),
        text: t("coparent.share_text", { name: babyName, code }),
      });
    } catch {
      // user cancelled, ignore
    }
  };

  return (
    <Card className="border-0 shadow-card p-5 rounded-3xl bg-secondary/30">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-5 h-5 text-secondary-foreground" />
        <h3 className="font-display text-lg">{t("coparent.title", { name: babyName })}</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {parentsCount === 1 ? t("coparent.only_you") : t("coparent.n_parents", { n: parentsCount })}
      </p>

      {codes.length > 0 && (
        <div className="space-y-2 mb-3">
          {codes.map((c) => {
            const expires = new Date(c.expires_at);
            return (
              <div key={c.id} className="flex items-center gap-2 p-2 rounded-xl bg-card">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-lg tracking-wider">{c.code}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("coparent.expires", { datetime: format(expires, t("coparent.expires_format"), { locale }) })}
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => share(c.code)} aria-label={t("coparent.share_aria")}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => revoke(c.id)} aria-label={t("coparent.revoke_aria")}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Button onClick={generate} disabled={generating} className="w-full rounded-full">
        {generating ? t("coparent.generating") : codes.length > 0 ? t("coparent.gen_another") : t("coparent.gen_first")}
      </Button>
      <p className="text-xs text-muted-foreground mt-2">{t("coparent.validity_hint")}</p>
    </Card>
  );
};

export default CoParentSection;
