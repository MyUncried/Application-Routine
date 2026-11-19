import { StyleSheet, View } from "react-native";

import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { planningStrings } from "@/features/planning/planningStrings";
import { CatalogueNavigation } from "@/features/sessions/CatalogueNavigation";
import { colors } from "@/shared/ui/tokens";

/**
 * Barre de titre à onglets du Calendrier (D-532, DSF Barre de titre à onglets du 19/11/2026) : Journal · Agenda · Vue
 * d'ensemble, au format des onglets des Catalogues (composant partagé `CatalogueNavigation`).
 * D-535 (19/11/2026) : l'onglet Journal ouvre le Journal des routines (il remplace la vue Jour) ; Vue d'ensemble reste
 * présente et indisponible.
 */
export type CalendarView = "journal" | "agenda";

export function CalendarViewTabs({ value, onChange }: { readonly value: CalendarView; readonly onChange: (view: CalendarView) => void }) {
  const t = planningStrings.calendar;
  // Valeurs d'onglet conservées depuis D-532 (« day », « week », « month ») : identifiants de test inchangés.
  const views = [
    { value: "day", view: "journal", label: t.views.day },
    { value: "week", view: "agenda", label: t.views.week },
    { value: "month", view: null, label: t.views.month },
  ] as const;
  const current = views.find((item) => item.view === value)!.value;
  return (
    <View style={styles.tabs}>
      <CatalogueNavigation
        options={views.map((item) => ({
          value: item.value,
          label: item.label,
          disabled: item.view === null,
          accessibilityLabel: item.view === null ? fillTemplate(t.viewUnavailable, { view: item.label }) : item.label,
        }))}
        value={current}
        onChange={(next) => {
          const view = views.find((item) => item.value === next)?.view;
          if (view !== undefined && view !== null) onChange(view);
        }}
        selectedColor={colors.catalogueSessionsContext}
        testID="calendar-view-row"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flex: 1, alignSelf: "stretch" },
});
