import { useState } from "react";
import { useDayLogs } from "@/hooks/useDayLogs";
import SummaryCard from "@/components/SummaryCard";
import TimelineList from "@/components/TimelineList";
import DayTypeDialog, { type LogType } from "@/components/DayTypeDialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarCheck } from "lucide-react";
import { format, addDays, isToday } from "date-fns";
import { useT, useDateLocale } from "@/lib/i18n";

const Today = () => {
  const t = useT();
  const locale = useDateLocale();
  // Start on the date deep-linked from the calendar (if any), otherwise today.
  const [date, setDate] = useState<Date>(() => {
    const stored = sessionStorage.getItem("baby-journal:selectedDate");
    if (stored) {
      sessionStorage.removeItem("baby-journal:selectedDate");
      const d = new Date(stored);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });
  const { sleep, diapers, feedings, refresh } = useDayLogs(date);
  const [filterType, setFilterType] = useState<LogType | null>(null);

  const viewingToday = isToday(date);

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

      <SummaryCard sleep={sleep} diapers={diapers} feedings={feedings} onSelectType={setFilterType} />
      <TimelineList sleep={sleep} diapers={diapers} feedings={feedings} onChange={refresh} />

      <DayTypeDialog
        open={filterType !== null}
        onOpenChange={(o) => !o && setFilterType(null)}
        type={filterType}
        sleep={sleep}
        diapers={diapers}
        feedings={feedings}
        onChange={refresh}
      />
    </div>
  );
};

export default Today;
