import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { it, enUS, type Locale } from "date-fns/locale";

export type Lang = "it" | "en";

const STORAGE_KEY = "baby-journal:lang";

const detectInitial = (): Lang => {
  if (typeof window === "undefined") return "it";
  const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (stored === "it" || stored === "en") return stored;
  const nav = window.navigator?.language?.toLowerCase() ?? "";
  return nav.startsWith("en") ? "en" : "it";
};

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: Locale;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/* ---------------------------------------------------------------------- */
/*                            String dictionary                            */
/* ---------------------------------------------------------------------- */

const DICT: Record<Lang, Record<string, string>> = {
  it: {
    // Common
    "common.save": "Salva",
    "common.cancel": "Annulla",
    "common.delete": "Elimina",
    "common.add": "Aggiungi",
    "common.continue": "Continua",
    "common.or": "oppure",
    "common.notes": "Note",
    "common.notes_optional": "Note (opz.)",
    "common.start": "Inizio",
    "common.end": "Fine",
    "common.when": "Quando",
    "common.deleted": "Eliminato",
    "common.confirm_delete_event": "Eliminare questo evento?",
    "common.error": "Errore",
    "common.discard_title": "Scartare le modifiche?",
    "common.discard_desc": "I dati inseriti non verranno salvati.",
    "common.keep_editing": "Continua a modificare",
    "common.discard": "Scarta",

    // Header / Nav
    "header.hello": "Ciao 👋",
    "header.weeks": "Settimane",
    "header.months": "Mesi",
    "nav.today": "Oggi",
    "nav.calendar": "Calendario",
    "nav.gocce": "Gocce",
    "nav.weight": "Peso",
    "nav.family": "Famiglia",
    "nav.add_aria": "Aggiungi",
    "gocce.title": "💧 Gocce di oggi",
    "gocce.empty": "Nessuna voce configurata.",

    // Auth
    "auth.welcome_back": "Bentornata 💕",
    "auth.create_account": "Crea il tuo account",
    "auth.name": "Nome",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.sign_in": "Accedi",
    "auth.sign_up": "Registrati",
    "auth.no_account": "Non hai un account?",
    "auth.have_account": "Hai già un account?",
    "auth.google": "Continua con Google",
    "auth.signup_success": "Account creato! Ora puoi accedere.",

    // Onboarding
    "onboarding.add_baby": "Aggiungi la tua piccola",
    "onboarding.subtitle": "Ci servono solo poche informazioni",
    "onboarding.name_placeholder": "Es. Sofia",
    "onboarding.birth_date": "Data di nascita",
    "onboarding.gender": "Sesso (opzionale)",
    "onboarding.female": "Femmina",
    "onboarding.male": "Maschio",
    "onboarding.prefer_not": "Preferisco non dire",
    "onboarding.have_invite": "Hai un codice invito da un co-genitore?",
    "onboarding.added": "{name} aggiunta! 💕",

    // Today / day navigator
    "today.prev_day": "Giorno precedente",
    "today.next_day": "Giorno successivo",
    "today.back_to_today": "Torna a oggi",

    // Summary card
    "summary.title": "Riepilogo",
    "summary.see_sleep": "Vedi sonno ({n})",
    "summary.see_diapers": "Vedi pannolini ({n})",
    "summary.see_feedings": "Vedi poppate ({n})",
    "summary.feed_times": "{n} poppate",

    // Timeline
    "timeline.empty": "Nessun evento per questo giorno.",
    "timeline.empty_hint": "Tocca + per aggiungerne uno.",
    "timeline.nap": "Sonnellino",
    "timeline.diaper": "Pannolino",
    "timeline.breast": "Seno",
    "timeline.breast_left": "sx",
    "timeline.breast_right": "dx",
    "timeline.breast_both": "entrambi",
    "timeline.formula": "Formula",

    // QuickAdd
    "quickadd.title": "Cosa vuoi tracciare?",
    "quickadd.sleep": "Sonno",
    "quickadd.diaper": "Pannolino",
    "quickadd.feeding": "Poppata",

    // DayTypeDialog
    "daytype.sleep": "Sonno",
    "daytype.diapers": "Pannolini",
    "daytype.feedings": "Poppate",

    // Sleep dialog
    "sleep.title": "💤 Sonno",
    "sleep.invalid_range": "La fine deve essere dopo l'inizio",
    "sleep.saved": "Sonno registrato 💤",

    // Feeding dialog
    "feeding.title": "🍼 Latte",
    "feeding.breast": "Seno",
    "feeding.formula": "Formula",
    "feeding.side": "Lato (opz.)",
    "feeding.left": "Sinistro",
    "feeding.right": "Destro",
    "feeding.both": "Entrambi",
    "feeding.amount": "Quantità (ml)",
    "feeding.amount_placeholder": "Es. 90",
    "feeding.missing_ml": "Inserisci i ml",
    "feeding.saved": "Poppata registrata 🍼",

    // Diaper dialog
    "diaper.title": "🧷 Pannolino",
    "diaper.when": "Quando",
    "diaper.pee": "💧 Pipì",
    "diaper.poo": "💩 Cacca",
    "diaper.choose_type": "Seleziona almeno un tipo",
    "diaper.saved": "Pannolino registrato 🧷",

    // Weight dialog + page
    "weight.title": "⚖️ Peso",
    "weight.date": "Data",
    "weight.weight": "Peso",
    "weight.notes_placeholder": "Opzionali",
    "weight.invalid": "Inserisci un peso valido",
    "weight.saved": "Peso registrato ⚖️",
    "weight.heading": "Peso",
    "weight.no_data": "Nessun dato. Aggiungi il primo peso ⚖️",
    "weight.empty_records": "Nessun record",
    "weight.col_date": "Data",
    "weight.col_weight": "Peso",
    "weight.col_actions": "Azioni",
    "weight.confirm_delete": "Eliminare questo record?",
    "weight.confirm_delete_body": "L'azione non può essere annullata.",

    // Calendar
    "calendar.legend": "Legenda",
    "calendar.sleep": "Sonno",
    "calendar.feeding": "Allattamento",
    "calendar.diaper": "Pannolino",
    "calendar.hint": "Tocca un giorno per vedere il dettaglio. Mese: {month}",

    // Family
    "family.account": "Account",
    "family.sign_out": "Esci",
    "family.refresh_app": "Aggiorna app",
    "family.refresh_app_title": "Forza il caricamento dell'ultima versione dell'app",
    "family.your_babies": "I tuoi bambini",
    "family.born_on": "Nata il {date}",
    "family.invite_code": "Inserisci un codice invito",
    "family.invite_hint": "Se un altro genitore ti ha condiviso un codice, inseriscilo per collegarti al bambino.",
    "family.language": "Lingua",

    // Co-parent
    "coparent.title": "Co-genitore di {name}",
    "coparent.only_you": "Solo tu sei collegato a questo bambino.",
    "coparent.n_parents": "{n} genitori collegati.",
    "coparent.expires": "Scade il {datetime}",
    "coparent.expires_format": "d MMM yyyy 'alle' HH:mm",
    "coparent.generating": "Genero…",
    "coparent.gen_another": "Genera un altro codice",
    "coparent.gen_first": "Genera codice invito",
    "coparent.validity_hint": "Il codice è valido 7 giorni e può essere usato una sola volta.",
    "coparent.share_aria": "Condividi",
    "coparent.revoke_aria": "Revoca",
    "coparent.revoke_confirm": "Revocare questo codice? Non sarà più utilizzabile.",
    "coparent.revoked": "Codice revocato",
    "coparent.code_generated": "Codice generato",
    "coparent.code_copied": "Codice copiato",
    "coparent.copy_failed": "Copia non riuscita",
    "coparent.share_title": "Codice Baby Journal",
    "coparent.share_text": "Ti invito a tracciare {name} con me su Baby Journal. Inserisci il codice {code} entro 7 giorni.",
    "coparent.cant_generate": "Impossibile generare un codice, riprova",

    // Redeem code
    "redeem.label": "Codice invito",
    "redeem.placeholder": "Es. 123456",
    "redeem.verifying": "Verifico…",
    "redeem.submit": "Collega bambino",
    "redeem.linked": "Collegato al bambino 💕",
    "redeem.invalid": "Codice non valido",

    // Age
    "age.day_one": "1 giorno",
    "age.days": "{n} giorni",
    "age.week_one": "1 settimana",
    "age.weeks": "{n} settimane",
    "age.month_one": "1 mese",
    "age.months": "{n} mesi",

    // 404
    "nf.subtitle": "Oops! Pagina non trovata",
    "nf.return": "Torna alla home",
  },
  en: {
    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.add": "Add",
    "common.continue": "Continue",
    "common.or": "or",
    "common.notes": "Notes",
    "common.notes_optional": "Notes (opt.)",
    "common.start": "Start",
    "common.end": "End",
    "common.when": "When",
    "common.deleted": "Deleted",
    "common.confirm_delete_event": "Delete this event?",
    "common.error": "Error",
    "common.discard_title": "Discard changes?",
    "common.discard_desc": "The data you entered will not be saved.",
    "common.keep_editing": "Keep editing",
    "common.discard": "Discard",

    // Header / Nav
    "header.hello": "Hi 👋",
    "header.weeks": "Weeks",
    "header.months": "Months",
    "nav.today": "Today",
    "nav.calendar": "Calendar",
    "nav.gocce": "Drops",
    "nav.weight": "Weight",
    "nav.family": "Family",
    "nav.add_aria": "Add",
    "gocce.title": "💧 Today's drops",
    "gocce.empty": "No items configured.",

    // Auth
    "auth.welcome_back": "Welcome back 💕",
    "auth.create_account": "Create your account",
    "auth.name": "Name",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.sign_in": "Sign in",
    "auth.sign_up": "Sign up",
    "auth.no_account": "Don't have an account?",
    "auth.have_account": "Already have an account?",
    "auth.google": "Continue with Google",
    "auth.signup_success": "Account created! You can now sign in.",

    // Onboarding
    "onboarding.add_baby": "Add your little one",
    "onboarding.subtitle": "We just need a few details",
    "onboarding.name_placeholder": "e.g. Sofia",
    "onboarding.birth_date": "Birth date",
    "onboarding.gender": "Sex (optional)",
    "onboarding.female": "Girl",
    "onboarding.male": "Boy",
    "onboarding.prefer_not": "Prefer not to say",
    "onboarding.have_invite": "Have an invite code from a co-parent?",
    "onboarding.added": "{name} added! 💕",

    // Today
    "today.prev_day": "Previous day",
    "today.next_day": "Next day",
    "today.back_to_today": "Back to today",

    // Summary card
    "summary.title": "Summary",
    "summary.see_sleep": "View sleep ({n})",
    "summary.see_diapers": "View diapers ({n})",
    "summary.see_feedings": "View feedings ({n})",
    "summary.feed_times": "{n} feeds",

    // Timeline
    "timeline.empty": "No events for this day.",
    "timeline.empty_hint": "Tap + to add one.",
    "timeline.nap": "Nap",
    "timeline.diaper": "Diaper",
    "timeline.breast": "Breast",
    "timeline.breast_left": "left",
    "timeline.breast_right": "right",
    "timeline.breast_both": "both",
    "timeline.formula": "Formula",

    // QuickAdd
    "quickadd.title": "What do you want to track?",
    "quickadd.sleep": "Sleep",
    "quickadd.diaper": "Diaper",
    "quickadd.feeding": "Feeding",

    // DayTypeDialog
    "daytype.sleep": "Sleep",
    "daytype.diapers": "Diapers",
    "daytype.feedings": "Feedings",

    // Sleep dialog
    "sleep.title": "💤 Sleep",
    "sleep.invalid_range": "End must be after start",
    "sleep.saved": "Sleep saved 💤",

    // Feeding dialog
    "feeding.title": "🍼 Milk",
    "feeding.breast": "Breast",
    "feeding.formula": "Formula",
    "feeding.side": "Side (opt.)",
    "feeding.left": "Left",
    "feeding.right": "Right",
    "feeding.both": "Both",
    "feeding.amount": "Amount (ml)",
    "feeding.amount_placeholder": "e.g. 90",
    "feeding.missing_ml": "Enter the ml",
    "feeding.saved": "Feeding saved 🍼",

    // Diaper dialog
    "diaper.title": "🧷 Diaper",
    "diaper.when": "When",
    "diaper.pee": "💧 Pee",
    "diaper.poo": "💩 Poo",
    "diaper.choose_type": "Select at least one type",
    "diaper.saved": "Diaper saved 🧷",

    // Weight
    "weight.title": "⚖️ Weight",
    "weight.date": "Date",
    "weight.weight": "Weight",
    "weight.notes_placeholder": "Optional",
    "weight.invalid": "Enter a valid weight",
    "weight.saved": "Weight saved ⚖️",
    "weight.heading": "Weight",
    "weight.no_data": "No data. Add the first weight ⚖️",
    "weight.empty_records": "No records",
    "weight.col_date": "Date",
    "weight.col_weight": "Weight",
    "weight.col_actions": "Actions",
    "weight.confirm_delete": "Delete this record?",
    "weight.confirm_delete_body": "This action cannot be undone.",

    // Calendar
    "calendar.legend": "Legend",
    "calendar.sleep": "Sleep",
    "calendar.feeding": "Feeding",
    "calendar.diaper": "Diaper",
    "calendar.hint": "Tap a day to see details. Month: {month}",

    // Family
    "family.account": "Account",
    "family.sign_out": "Sign out",
    "family.refresh_app": "Refresh app",
    "family.refresh_app_title": "Force-load the latest app version",
    "family.your_babies": "Your babies",
    "family.born_on": "Born on {date}",
    "family.invite_code": "Redeem an invite code",
    "family.invite_hint": "If another parent shared a code, enter it to link to the baby.",
    "family.language": "Language",

    // Co-parent
    "coparent.title": "Co-parent for {name}",
    "coparent.only_you": "Only you are linked to this baby.",
    "coparent.n_parents": "{n} parents linked.",
    "coparent.expires": "Expires on {datetime}",
    "coparent.expires_format": "d MMM yyyy 'at' HH:mm",
    "coparent.generating": "Generating…",
    "coparent.gen_another": "Generate another code",
    "coparent.gen_first": "Generate invite code",
    "coparent.validity_hint": "The code is valid for 7 days and can be used once.",
    "coparent.share_aria": "Share",
    "coparent.revoke_aria": "Revoke",
    "coparent.revoke_confirm": "Revoke this code? It won't be usable anymore.",
    "coparent.revoked": "Code revoked",
    "coparent.code_generated": "Code generated",
    "coparent.code_copied": "Code copied",
    "coparent.copy_failed": "Copy failed",
    "coparent.share_title": "Baby Journal code",
    "coparent.share_text": "Join me on Baby Journal to track {name}. Enter code {code} within 7 days.",
    "coparent.cant_generate": "Unable to generate a code, please retry",

    // Redeem
    "redeem.label": "Invite code",
    "redeem.placeholder": "e.g. 123456",
    "redeem.verifying": "Verifying…",
    "redeem.submit": "Link baby",
    "redeem.linked": "Linked to the baby 💕",
    "redeem.invalid": "Invalid code",

    // Age
    "age.day_one": "1 day",
    "age.days": "{n} days",
    "age.week_one": "1 week",
    "age.weeks": "{n} weeks",
    "age.month_one": "1 month",
    "age.months": "{n} months",

    // 404
    "nf.subtitle": "Oops! Page not found",
    "nf.return": "Return to home",
  },
};

const interpolate = (s: string, params?: Record<string, string | number>) =>
  params ? s.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? String(params[k]) : `{${k}}`)) : s;

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(detectInitial);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { window.localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore quota */ }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const s = DICT[lang][key] ?? DICT.it[key] ?? key;
      return interpolate(s, params);
    },
    [lang],
  );

  const locale = useMemo(() => (lang === "en" ? enUS : it), [lang]);

  const value = useMemo<I18nContextValue>(() => ({ lang, setLang, t, locale }), [lang, setLang, t, locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
};

/** Shorthand for the most common use: just the `t` function. */
export const useT = () => useI18n().t;

/** date-fns Locale matching the current language. */
export const useDateLocale = () => useI18n().locale;
