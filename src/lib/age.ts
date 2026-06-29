import { differenceInDays, differenceInMonths, differenceInWeeks } from "date-fns";

export type AgeUnit = "weeks" | "months";

/** Returns the age in the chosen unit. The caller supplies a translator so we
 *  stay decoupled from i18n internals — pass `useT()` from `@/lib/i18n`. */
export function getAge(
  birthDate: string | Date,
  unit: AgeUnit,
  t: (key: string, params?: Record<string, string | number>) => string,
): { value: number; label: string } {
  const d = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const now = new Date();
  if (unit === "weeks") {
    const w = differenceInWeeks(now, d);
    return { value: w, label: w === 1 ? t("age.week_one") : t("age.weeks", { n: w }) };
  }
  const m = differenceInMonths(now, d);
  if (m === 0) {
    const days = differenceInDays(now, d);
    return { value: 0, label: days === 1 ? t("age.day_one") : t("age.days", { n: days }) };
  }
  return { value: m, label: m === 1 ? t("age.month_one") : t("age.months", { n: m }) };
}
