import { Toggle } from "@/components/ui/toggle";
import { useI18n, type Lang } from "@/lib/i18n";

interface Props {
  /** "compact" = small pill (header), "full" = wider pill for settings rows. */
  size?: "compact" | "full";
  className?: string;
}

const OPTIONS: { v: Lang; l: string }[] = [
  { v: "it", l: "IT" },
  { v: "en", l: "EN" },
];

const LanguageToggle = ({ size = "compact", className = "" }: Props) => {
  const { lang, setLang } = useI18n();
  const pillClass = size === "compact" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-sm";
  return (
    <div className={`inline-flex bg-card rounded-full p-0.5 shadow-card ${className}`}>
      {OPTIONS.map((o) => (
        <Toggle
          key={o.v}
          pressed={lang === o.v}
          onPressedChange={() => setLang(o.v)}
          size="sm"
          aria-label={`Set language to ${o.l}`}
          className={`rounded-full font-medium ${pillClass} data-[state=on]:bg-primary data-[state=on]:text-primary-foreground`}
        >
          {o.l}
        </Toggle>
      ))}
    </div>
  );
};

export default LanguageToggle;
