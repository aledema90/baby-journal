import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Moon, Droplets, Milk } from "lucide-react";
import { useState } from "react";
import SleepDialog from "./tracking/SleepDialog";
import DiaperDialog from "./tracking/DiaperDialog";
import FeedingDialog from "./tracking/FeedingDialog";
import { useT } from "@/lib/i18n";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const QuickAddSheet = ({ open, onOpenChange }: Props) => {
  const t = useT();
  const [sleepOpen, setSleepOpen] = useState(false);
  const [diaperOpen, setDiaperOpen] = useState(false);
  const [feedingOpen, setFeedingOpen] = useState(false);

  const pick = (type: "sleep" | "diaper" | "feeding") => {
    onOpenChange(false);
    setTimeout(() => {
      if (type === "sleep") setSleepOpen(true);
      if (type === "diaper") setDiaperOpen(true);
      if (type === "feeding") setFeedingOpen(true);
    }, 150);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl border-0">
          <SheetHeader>
            <SheetTitle className="font-display text-xl text-center">{t("quickadd.title")}</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 py-6">
            <button onClick={() => pick("sleep")} className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-sleep/40 hover:bg-sleep/60 transition-colors">
              <div className="w-12 h-12 rounded-full bg-sleep flex items-center justify-center">
                <Moon className="w-6 h-6 text-sleep-foreground" />
              </div>
              <span className="text-sm font-medium text-sleep-foreground">{t("quickadd.sleep")}</span>
            </button>
            <button onClick={() => pick("diaper")} className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-diaper/40 hover:bg-diaper/60 transition-colors">
              <div className="w-12 h-12 rounded-full bg-diaper flex items-center justify-center">
                <Droplets className="w-6 h-6 text-diaper-foreground" />
              </div>
              <span className="text-sm font-medium text-diaper-foreground">{t("quickadd.diaper")}</span>
            </button>
            <button onClick={() => pick("feeding")} className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-feeding/40 hover:bg-feeding/60 transition-colors">
              <div className="w-12 h-12 rounded-full bg-feeding flex items-center justify-center">
                <Milk className="w-6 h-6 text-feeding-foreground" />
              </div>
              <span className="text-sm font-medium text-feeding-foreground">{t("quickadd.feeding")}</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
      <SleepDialog open={sleepOpen} onOpenChange={setSleepOpen} />
      <DiaperDialog open={diaperOpen} onOpenChange={setDiaperOpen} />
      <FeedingDialog open={feedingOpen} onOpenChange={setFeedingOpen} />
    </>
  );
};

export default QuickAddSheet;
