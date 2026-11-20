import { planningStrings } from "@/features/planning/planningStrings";
import type { TabbedScreenPalette, TabbedScreenTabs } from "@/shared/ui/TabbedScreen";
import { colors } from "@/shared/ui/tokens";

/**
 * Barre de titre à onglets du Calendrier (D-532, DSF Barre de titre à onglets du 19/11/2026), au format des onglets des
 * Catalogues. Rendue par le haut d'écran partagé `TabbedScreen` (19/11/2026).
 * D-535 (19/11/2026) : l'onglet Journal ouvre le Journal des routines (il remplace la vue Jour).
 * D-542 (Hermann, 20/11/2026) : deux onglets seulement, Journal · Agenda, centrés sur la barre (centres à x = 139,5 et
 * 262,5, emplacements d'un tiers comme les Catalogues). [Troisième onglet « Vue d'ensemble », présent et indisponible —
 * retiré.]
 */
export type CalendarView = "journal" | "agenda";

type CalendarTab = "day" | "week";

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
  // Valeurs d'onglet conservées depuis D-532 (« day », « week ») : identifiants de test inchangés.
  const views = [
    { value: "day", view: "journal", label: t.views.day },
    { value: "week", view: "agenda", label: t.views.week },
  ] as const;
  return {
    options: views.map((item) => ({ value: item.value, label: item.label })),
    value: views.find((item) => item.view === value)!.value,
    onChange: (next) => {
      const view = views.find((item) => item.value === next)?.view;
      if (view !== undefined) onChange(view);
    },
    slotFraction: 1 / 3,
    testID: "calendar-view-row",
  };
}
