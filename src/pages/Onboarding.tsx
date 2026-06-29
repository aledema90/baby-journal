import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBaby } from "@/hooks/useBaby";
import { toast } from "sonner";
import { Baby as BabyIcon } from "lucide-react";
import RedeemCodeForm from "@/components/RedeemCodeForm";
import LanguageToggle from "@/components/LanguageToggle";
import { useT } from "@/lib/i18n";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refresh } = useBaby();
  const t = useT();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("babies").insert({
      name: name.trim(),
      birth_date: birthDate,
      gender: gender || null,
      created_by: user.id,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("onboarding.added", { name }));
    await refresh();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-soft">
      <div className="fixed top-4 right-4 z-10">
        <LanguageToggle />
      </div>
      <Card className="w-full max-w-md shadow-soft border-0 animate-fade-in">
        <CardContent className="p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-3">
              <BabyIcon className="w-7 h-7 text-secondary-foreground" />
            </div>
            <h1 className="text-2xl font-display">{t("onboarding.add_baby")}</h1>
            <p className="text-sm text-muted-foreground mt-1 text-center">{t("onboarding.subtitle")}</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bname">{t("auth.name")}</Label>
              <Input id="bname" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} placeholder={t("onboarding.name_placeholder")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bdate">{t("onboarding.birth_date")}</Label>
              <Input id="bdate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required max={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("onboarding.gender")}</Label>
              <div className="flex gap-2">
                {[
                  { v: "female", l: t("onboarding.female") },
                  { v: "male", l: t("onboarding.male") },
                  { v: "", l: t("onboarding.prefer_not") },
                ].map((o) => (
                  <Button
                    key={o.l}
                    type="button"
                    variant={gender === o.v ? "default" : "outline"}
                    size="sm"
                    className="rounded-full flex-1"
                    onClick={() => setGender(o.v)}
                  >
                    {o.l}
                  </Button>
                ))}
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-full h-11">
              {t("common.continue")}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t("common.or")}</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-3 text-center">{t("onboarding.have_invite")}</p>
          <RedeemCodeForm onRedeemed={() => navigate("/")} compact />
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
