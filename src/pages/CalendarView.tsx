import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import { Card } from "@/components/ui/card";
import { useMonthActivity } from "@/hooks/useMonthActivity";
import { format } from "date-fns";
import { useT, useDateLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const CalendarView = () => {
  const navigate = useNavigate();
  const t = useT();
  const locale = useDateLocale();
  const [month, setMonth] = useState<Date>(new Date());
  const { days } = useMonthActivity(month);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    sessionStorage.setItem("baby-journal:selectedDate", date.toISOString());
    navigate("/");
  };

  return (
    <div className="space-y-4 pb-4">
      <Card className="border-0 shadow-card rounded-3xl p-4">
        <DayPicker
          mode="single"
          locale={locale}
          month={month}
          onMonthChange={setMonth}
          onSelect={handleSelect}
          showOutsideDays
          className="p-1 pointer-events-auto"
          classNames={{
            months: "flex flex-col",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium capitalize",
            nav: "space-x-1 flex items-center",
            nav_button: cn(buttonVariants({ variant: "ghost" }), "h-7 w-7 bg-transparent p-0"),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.75rem]",
            row: "flex w-full mt-1",
            cell: "h-12 w-10 text-center text-sm p-0 relative",
            day: cn(buttonVariants({ variant: "ghost" }), "h-10 w-10 p-0 font-normal rounded-full"),
            day_today: "bg-accent/40 text-accent-foreground",
            day_outside: "text-muted-foreground opacity-40",
            day_disabled: "text-muted-foreground opacity-50",
            day_hidden: "invisible",
          }}
          components={{
            IconLeft: () => <ChevronLeft className="h-4 w-4" />,
            IconRight: () => <ChevronRight className="h-4 w-4" />,
            DayContent: ({ date }) => {
              const a = days[dayKey(date)];
              return (
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <span>{date.getDate()}</span>
                  <div className="flex gap-0.5 h-1.5">
                    {a?.sleep && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    {a?.feeding && <span className="w-1.5 h-1.5 rounded-full bg-secondary-foreground" />}
                    {a?.diaper && <span className="w-1.5 h-1.5 rounded-full bg-accent-foreground" />}
                  </div>
                </div>
              );
            },
          }}
        />
      </Card>

      <Card className="border-0 shadow-card rounded-3xl p-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">{t("calendar.legend")}</p>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> {t("calendar.sleep")}</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-secondary-foreground" /> {t("calendar.feeding")}</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent-foreground" /> {t("calendar.diaper")}</div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {t("calendar.hint", { month: format(month, "MMMM yyyy", { locale }) })}
        </p>
      </Card>
    </div>
  );
};

export default CalendarView;
