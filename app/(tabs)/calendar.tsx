import { useState } from "react";

import { CalendarWeekScreen } from "@/features/planning/CalendarWeekScreen";
import type { CalendarView } from "@/features/planning/CalendarViewTabs";
import { JournalScreen } from "@/features/planning/JournalScreen";
import { PlanScreen } from "@/features/planning/PlanScreen";

/**
 * Onglet « Calendrier » — vue Agenda (ancienne vue Semaine, CE-UI-03, D-533) par défaut, comme avant. D-535
 * (19/11/2026) : l’onglet Journal de la barre de titre ouvre le Journal des routines, qui remplace la vue Jour ; la vue
 * choisie est conservée tant que l’onglet Calendrier reste monté. [Vue d’ensemble : retirée (D-542, 20/11/2026).]
 */
export default function CalendarScreen() {
  const [view, setView] = useState<CalendarView>("agenda");
  // D-554 (21/11/2026) : troisième onglet « Plan ».
  if (view === "journal") return <JournalScreen onChangeView={setView} />;
  if (view === "plan") return <PlanScreen onChangeView={setView} />;
  return <CalendarWeekScreen onChangeView={setView} />;
}
