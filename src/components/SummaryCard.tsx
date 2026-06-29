import { Card } from "@/components/ui/card";
import { Moon, Droplets, Milk } from "lucide-react";
import type { SleepLog, DiaperLog, FeedingLog } from "@/hooks/useDayLogs";
import type { LogType } from "./DayTypeDialog";
import { useT } from "@/lib/i18n";

interface Props {
  sleep: SleepLog[];
  diapers: DiaperLog[];
  feedings: FeedingLog[];
  /** When provided, the three tiles become buttons that open a filtered view. */
  onSelectType?: (type: LogType) => void;
}

const fmtMin = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};

const SummaryCard = ({ sleep, diapers, feedings, onSelectType }: Props) => {
  const t = useT();
  const sleepMin = sleep.reduce((acc, s) => acc + Math.round((+new Date(s.end_at) - +new Date(s.start_at)) / 60000), 0);
  const peeCount = diapers.filter((d) => d.pee).length;
  const pooCount = diapers.filter((d) => d.poo).length;
  // Total ml of milk added across the day. Legacy breast entries carry no ml
  // and simply contribute 0, but still count as a feed in the subtitle.
  const totalMl = feedings.reduce((a, f) => a + (f.formula_ml ?? 0), 0);

  // Tiles render as <button> when onSelectType is wired up, plain <div>
  // otherwise — preserves the original layout when reused elsewhere.
  const Tile = onSelectType ? "button" : "div";
  const tileBase = "rounded-2xl p-3 text-center";
  const tileInteractive = onSelectType
    ? " w-full transition-transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    : "";

  return (
    <Card className="border-0 shadow-card bg-card/80 backdrop-blur p-5 rounded-3xl">
      <h2 className="font-display text-lg mb-4">{t("summary.title")}</h2>
      <div className="grid grid-cols-3 gap-3">
        <Tile
          type={onSelectType ? "button" : undefined}
          onClick={onSelectType ? () => onSelectType("sleep") : undefined}
          aria-label={onSelectType ? t("summary.see_sleep", { n: sleep.length }) : undefined}
          className={`${tileBase} bg-sleep/40${tileInteractive}`}
        >
          <Moon className="w-5 h-5 mx-auto text-sleep-foreground mb-1" />
          <div className="text-2xl font-display text-sleep-foreground">{fmtMin(sleepMin)}</div>
          <div className="text-xs text-sleep-foreground/80">{sleep.length}</div>
        </Tile>
        <Tile
          type={onSelectType ? "button" : undefined}
          onClick={onSelectType ? () => onSelectType("diaper") : undefined}
          aria-label={onSelectType ? t("summary.see_diapers", { n: diapers.length }) : undefined}
          className={`${tileBase} bg-diaper/40${tileInteractive}`}
        >
          <Droplets className="w-5 h-5 mx-auto text-diaper-foreground mb-1" />
          <div className="text-2xl font-display text-diaper-foreground">{diapers.length}</div>
          <div className="text-xs text-diaper-foreground/80">{peeCount}💧 {pooCount}💩</div>
        </Tile>
        <Tile
          type={onSelectType ? "button" : undefined}
          onClick={onSelectType ? () => onSelectType("feeding") : undefined}
          aria-label={onSelectType ? t("summary.see_feedings", { n: feedings.length }) : undefined}
          className={`${tileBase} bg-feeding/40${tileInteractive}`}
        >
          <Milk className="w-5 h-5 mx-auto text-feeding-foreground mb-1" />
          <div className="text-2xl font-display text-feeding-foreground">{totalMl ? `${totalMl}ml` : "—"}</div>
          <div className="text-xs text-feeding-foreground/80">{t("summary.feed_times", { n: feedings.length })}</div>
        </Tile>
      </div>
    </Card>
  );
};

export default SummaryCard;
