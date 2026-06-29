import { NavLink, Outlet } from "react-router-dom";
import { CalendarDays, Home, Users, Plus, Scale, Pill } from "lucide-react";
import { useState } from "react";
import { useBaby } from "@/hooks/useBaby";
import { cn } from "@/lib/utils";
import QuickAddSheet from "./QuickAddSheet";
import LanguageToggle from "./LanguageToggle";
import { getAge, AgeUnit } from "@/lib/age";
import { Toggle } from "@/components/ui/toggle";
import { useT } from "@/lib/i18n";

const AppLayout = () => {
  const { currentBaby } = useBaby();
  const t = useT();
  const [quickOpen, setQuickOpen] = useState(false);
  const [unit, setUnit] = useState<AgeUnit>("weeks");
  const age = currentBaby ? getAge(currentBaby.birth_date, unit, t) : null;

  const navItems = [
    { to: "/", icon: Home, label: t("nav.today") },
    { to: "/calendar", icon: CalendarDays, label: t("nav.calendar") },
    { to: "/gocce", icon: Pill, label: t("nav.gocce") },
    { to: "/weight", icon: Scale, label: t("nav.weight") },
    { to: "/family", icon: Users, label: t("nav.family") },
  ];

  return (
    <div className="min-h-screen bg-gradient-soft pb-24">
      <header className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("header.hello")}</p>
            <h1 className="font-display text-2xl">{currentBaby?.name ?? "Baby Journal"}</h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <LanguageToggle />
            {currentBaby && (
              <>
                <span className="text-sm font-medium">{age?.label}</span>
                <div className="flex bg-card rounded-full p-0.5 shadow-card">
                  <Toggle
                    pressed={unit === "weeks"}
                    onPressedChange={() => setUnit("weeks")}
                    size="sm"
                    className="rounded-full text-xs h-7 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    {t("header.weeks")}
                  </Toggle>
                  <Toggle
                    pressed={unit === "months"}
                    onPressedChange={() => setUnit("months")}
                    size="sm"
                    className="rounded-full text-xs h-7 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    {t("header.months")}
                  </Toggle>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="px-5 animate-fade-in">
        <Outlet />
      </main>

      {/* FAB */}
      <button
        onClick={() => setQuickOpen(true)}
        aria-label={t("nav.add_aria")}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-soft flex items-center justify-center hover:scale-105 transition-transform z-30"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-md border-t border-border z-20">
        <div className="max-w-md mx-auto grid grid-cols-5 px-2 py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-colors text-xs",
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                )
              }
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <QuickAddSheet open={quickOpen} onOpenChange={setQuickOpen} />
    </div>
  );
};

export default AppLayout;
