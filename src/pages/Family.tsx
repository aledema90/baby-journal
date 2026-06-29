import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBaby } from "@/hooks/useBaby";
import { LogOut, Plus, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import CoParentSection from "@/components/CoParentSection";
import RedeemCodeForm from "@/components/RedeemCodeForm";
import LanguageToggle from "@/components/LanguageToggle";
import { useT, useDateLocale } from "@/lib/i18n";

const Family = () => {
  const { user, signOut } = useAuth();
  const { babies, currentBaby, setCurrentBaby } = useBaby();
  const navigate = useNavigate();
  const t = useT();
  const locale = useDateLocale();

  return (
    <div className="space-y-4 pb-4">
      <Card className="border-0 shadow-card p-5 rounded-3xl">
        <h2 className="font-display text-lg mb-3">{t("family.account")}</h2>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm font-medium">{t("family.language")}</span>
          <LanguageToggle size="full" />
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="outline" className="rounded-full" onClick={signOut}>
            <LogOut className="w-4 h-4" /> {t("family.sign_out")}
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => window.location.reload()}
            title={t("family.refresh_app_title")}
          >
            <RefreshCw className="w-4 h-4" /> {t("family.refresh_app")}
          </Button>
        </div>
      </Card>

      <Card className="border-0 shadow-card p-5 rounded-3xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg">{t("family.your_babies")}</h2>
          <Button size="sm" variant="ghost" className="rounded-full" onClick={() => navigate("/onboarding")}>
            <Plus className="w-4 h-4" /> {t("common.add")}
          </Button>
        </div>
        <div className="space-y-2">
          {babies.map((b) => (
            <button
              key={b.id}
              onClick={() => setCurrentBaby(b)}
              className={`w-full text-left p-3 rounded-2xl border transition-colors ${currentBaby?.id === b.id ? "bg-primary/20 border-primary/40" : "bg-card border-border"}`}
            >
              <div className="font-semibold">{b.name}</div>
              <div className="text-xs text-muted-foreground">
                {t("family.born_on", { date: format(new Date(b.birth_date), "d MMMM yyyy", { locale }) })}
              </div>
            </button>
          ))}
        </div>
      </Card>

      {currentBaby && (
        <CoParentSection babyId={currentBaby.id} babyName={currentBaby.name} />
      )}

      <Card className="border-0 shadow-card p-5 rounded-3xl">
        <h3 className="font-display text-lg mb-1">{t("family.invite_code")}</h3>
        <p className="text-xs text-muted-foreground mb-3">{t("family.invite_hint")}</p>
        <RedeemCodeForm compact />
      </Card>
    </div>
  );
};

export default Family;
