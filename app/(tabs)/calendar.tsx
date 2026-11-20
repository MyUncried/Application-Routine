import { useState } from "react";

import { CalendarWeekScreen } from "@/features/planning/CalendarWeekScreen";
import type { CalendarView } from "@/features/planning/CalendarViewTabs";
import { JournalScreen } from "@/features/planning/JournalScreen";

/**
 * Onglet « Calendrier » — vue Agenda (ancienne vue Semaine, CE-UI-03, D-533) par défaut, comme avant. D-535
 * (19/11/2026) : l’onglet Journal de la barre de titre ouvre le Journal des routines, qui remplace la vue Jour ; la vue
 * choisie est conservée tant que l’onglet Calendrier reste monté. [Vue d’ensemble : retirée (D-542, 20/11/2026).]
 */
export default function CalendarScreen() {
  const [view, setView] = useState<CalendarView>("agenda");
  return view === "journal" ? <JournalScreen onChangeView={setView} /> : <CalendarWeekScreen onChangeView={setView} />;
}
