import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";

import { isLocalDate } from "@/domain/planning/Routine";
import { calendarArrivalView, noteCalendarView } from "@/features/planning/calendarArrival";
import { CalendarWeekScreen } from "@/features/planning/CalendarWeekScreen";
import type { CalendarView } from "@/features/planning/CalendarViewTabs";
import { JournalScreen } from "@/features/planning/JournalScreen";
import { PlanScreen } from "@/features/planning/PlanScreen";

/**
 * Onglet « Calendrier » — vue Agenda (ancienne vue Semaine, CE-UI-03, D-533) par défaut, comme avant. D-535
 * (19/11/2026) : l’onglet Journal de la barre de titre ouvre le Journal des routines, qui remplace la vue Jour ; la vue
 * choisie est conservée tant que l’onglet Calendrier reste monté. [Vue d’ensemble : retirée (D-542, 20/11/2026).]
 *
 * Recette du 21/11/2026 (Hermann) :
 * - « À l’ouverture, l’Agenda sélectionne la date du jour » : toucher l’onglet Calendrier de la barre de navigation repart
 *   du jour courant (le retour d’une modale, planification ou exécution, garde le jour choisi) ;
 * - « Après l’exécution d’une séance lancée depuis le catalogue, l’application ouvre l’Agenda à la date de l’exécution » :
 *   paramètres `day` (date) et `at` (instant de la demande, pour qu’une même date redemandée soit prise en compte).
 */
export default function CalendarScreen() {
  const params = useLocalSearchParams<{ day?: string; at?: string }>();
  const navigation = useNavigation();
  const at = typeof params.at === "string" ? params.at : "";
  const requestedDay =
    typeof params.day === "string" && isLocalDate(params.day)
      ? params.day
      : undefined;
  // Vue choisie et demande (`at`) en vigueur quand elle l’a été : une nouvelle demande d’ouverture à une date l’emporte.
  const [chosen, setChosen] = useState<{
    readonly view: CalendarView;
    readonly at: string;
  }>(() => ({ view: calendarArrivalView() ?? "agenda", at }));
  // Toucher l’onglet : nombre de touchers (clé de l’Agenda) et demande alors en vigueur, qui ne s’applique plus.
  const [tabPress, setTabPress] = useState<{
    readonly count: number;
    readonly at: string | null;
  }>({ count: 0, at: null });

  useEffect(() => {
    const tabs = navigation as unknown as {
      addListener: (event: "tabPress", handler: () => void) => () => void;
      isFocused: () => boolean;
    };
    return tabs.addListener("tabPress", () => {
      // D-562 (23/11/2026) : arrivée depuis le catalogue — Programmes ouvre le Plan, Séances ou Mouvements l'Agenda ; depuis un
      // autre onglet, la dernière vue utilisée. Toucher l'onglet déjà affiché ne change pas de vue.
      const arrival = tabs.isFocused() ? null : calendarArrivalView();
      if (arrival !== null) setChosen({ view: arrival, at });
      setTabPress((current) => ({ count: current.count + 1, at }));
    });
  }, [navigation, at]);

  const pendingDay =
    requestedDay !== undefined && at !== tabPress.at ? requestedDay : undefined;
  const view: CalendarView =
    pendingDay !== undefined && chosen.at !== at ? "agenda" : chosen.view;
  const setView = (next: CalendarView) => setChosen({ view: next, at });
  // Contre-recette du 23/11/2026 (constats f et g) : vue affichée, pour le segment ouvert en arrivant dans le catalogue (Plan →
  // Programmes, Agenda → Séances).
  useEffect(() => noteCalendarView(view), [view]);

  // D-554 (21/11/2026) : troisième onglet « Plan ».
  if (view === "journal") return <JournalScreen onChangeView={setView} />;
  if (view === "plan") return <PlanScreen onChangeView={setView} />;
  return (
    <CalendarWeekScreen
      key={`${tabPress.count}|${pendingDay !== undefined ? at : ""}`}
      {...(pendingDay !== undefined ? { initialDay: pendingDay } : {})}
      onChangeView={setView}
    />
  );
}
