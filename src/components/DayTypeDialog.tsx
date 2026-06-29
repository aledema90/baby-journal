import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Moon, Droplets, Milk } from "lucide-react";
import TimelineList from "./TimelineList";
import type { SleepLog, DiaperLog, FeedingLog } from "@/hooks/useDayLogs";
import { useT } from "@/lib/i18n";

export type LogType = "sleep" | "diaper" | "feeding";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  type: LogType | null;
  sleep: SleepLog[];
  diapers: DiaperLog[];
  feedings: FeedingLog[];
  onChange: () => void;
}

const ICONS: Record<LogType, typeof Moon> = {
  sleep: Moon,
  diaper: Droplets,
  feeding: Milk,
};

const TITLE_KEY: Record<LogType, string> = {
  sleep: "daytype.sleep",
  diaper: "daytype.diapers",
  feeding: "daytype.feedings",
};

/** Filtered detail view for a single log type. Reuses TimelineList by passing
 *  empty arrays for the other two types — edit/delete still work because
 *  TimelineList already wires those internally. */
const DayTypeDialog = ({ open, onOpenChange, type, sleep, diapers, feedings, onChange }: Props) => {
  const t = useT();
  if (!type) return null;
  const Icon = ICONS[type];
  const title = t(TITLE_KEY[type]);
  const filteredSleep = type === "sleep" ? sleep : [];
  const filteredDiapers = type === "diaper" ? diapers : [];
  const filteredFeedings = type === "feeding" ? feedings : [];
  const count = filteredSleep.length + filteredDiapers.length + filteredFeedings.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {title}
            <span className="text-sm font-normal text-muted-foreground">({count})</span>
          </DialogTitle>
        </DialogHeader>
        <TimelineList
          sleep={filteredSleep}
          diapers={filteredDiapers}
          feedings={filteredFeedings}
          onChange={onChange}
        />
      </DialogContent>
    </Dialog>
  );
};

export default DayTypeDialog;
