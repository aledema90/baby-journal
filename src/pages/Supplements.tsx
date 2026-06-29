import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarCheck } from "lucide-react";
import { format, addDays, isToday } from "date-fns";
import { useT, useDateLocale, useI18n } from "@/lib/i18n";
import { SUPPLEMENTS } from "@/config/supplements";
import { useSupplementLogs } from "@/hooks/useSupplementLogs";

const Supplements = () => {
  const t = useT();
  const { lang } = useI18n();
  const locale = useDateLocale();
  const [date, setDate] = useState<Date>(() => new Date());
  const { checkedKeys, toggle } = useSupplementLogs(date);

  const viewingToday = isToday(date);
  const doneCount = SUPPLEMENTS.filter((s) => checkedKeys.has(s.id)).length;

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <Button size="icon" variant="ghost" onClick={() => setDate(addDays(date, -1))} aria-label={t("today.prev_day")}>
          <ChevronLeft />
        </Button>
        <p className="text-sm font-medium capitalize">{format(date, "EEEE d MMMM", { locale })}</p>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setDate(addDays(date, 1))}
          disabled={viewingToday}
          aria-label={t("today.next_day")}
        >
          <ChevronRight />
        </Button>
      </div>

      {!viewingToday && (
        <div className="flex justify-center">
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setDate(new Date())}>
            <CalendarCheck className="w-4 h-4" /> {t("today.back_to_today")}
          </Button>
        </div>
      )}

      <Card className="border-0 shadow-card bg-card/80 backdrop-blur p-5 rounded-3xl">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-lg">{t("gocce.title")}</h2>
          <span className="text-xs text-muted-foreground">{doneCount}/{SUPPLEMENTS.length}</span>
        </div>

        {SUPPLEMENTS.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("gocce.empty")}</p>
        ) : (
          <ul className="space-y-2">
            {SUPPLEMENTS.map((s) => {
              const checked = checkedKeys.has(s.id);
              return (
                <li key={s.id}>
                  <label
                    className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3 cursor-pointer transition-colors hover:bg-muted/60"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => toggle(s.id, v === true)}
                      className="h-5 w-5"
                    />
                    <span className="text-xl leading-none">{s.emoji}</span>
                    <span className="flex-1 min-w-0">
                      <span className={`block text-sm font-semibold ${checked ? "line-through text-muted-foreground" : ""}`}>
                        {s.label[lang] ?? s.label.it}
                      </span>
                      {s.dose && <span className="block text-xs text-muted-foreground">{s.dose}</span>}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default Supplements;
