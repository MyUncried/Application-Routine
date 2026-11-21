import { planningStrings } from "@/features/planning/planningStrings";
import type { TabbedScreenPalette, TabbedScreenTabs } from "@/shared/ui/TabbedScreen";
import { colors } from "@/shared/ui/tokens";

/**
 * Barre de titre à onglets du Calendrier (D-532, DSF Barre de titre à onglets du 19/11/2026), au format des onglets des
 * Catalogues. Rendue par le haut d'écran partagé `TabbedScreen` (19/11/2026).
 * D-535 (19/11/2026) : l'onglet Journal ouvre le Journal des routines (il remplace la vue Jour).
 * D-554 (Hermann, 21/11/2026 ; DSF Plan § 1) : trois onglets Journal · Agenda · Plan, au format de la barre de titre — trois
 * emplacements de 123 à x = 16, 139 et 262 (répartition égale des Catalogues). [D-542 (20/11/2026) : deux onglets seulement,
 * Journal · Agenda, emplacements d'un tiers centrés — remplacé.]
 */
export type CalendarView = "journal" | "agenda" | "plan";

type CalendarTab = "day" | "week" | "plan";

/**
 * DSF Barre de titre § 2 : en-tête et barre d'état `#F7F7FF` ; zone de contexte et onglet actif `#EAEAFF` (couleurs du
 * Catalogue des séances). Fond d'écran inchangé (blanc).
 */
export const CALENDAR_PALETTE: TabbedScreenPalette = {
  context: colors.catalogueSessionsContext,
  header: colors.catalogueSessionsBackground,
};

export function calendarTabs(value: CalendarView, onChange: (view: CalendarView) => void): TabbedScreenTabs<CalendarTab> {
  const t = planningStrings.calendar;
  // Valeurs d'onglet conservées depuis D-532 (« day », « week ») : identifiants de test inchangés ; « plan » (D-554).
  const views = [
    { value: "day", view: "journal", label: t.views.day },
    { value: "week", view: "agenda", label: t.views.week },
    { value: "plan", view: "plan", label: t.views.plan },
  ] as const;
  return {
    options: views.map((item) => ({ value: item.value, label: item.label })),
    value: views.find((item) => item.view === value)!.value,
    onChange: (next) => {
      const view = views.find((item) => item.value === next)?.view;
      if (view !== undefined) onChange(view);
    },
    testID: "calendar-view-row",
  };
}
