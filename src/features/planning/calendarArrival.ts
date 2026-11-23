import type { CalendarView } from "@/features/planning/CalendarViewTabs";

/**
 * D-562 (recette du 23/11/2026, constats b et c) — onglet ouvert en arrivant dans le calendrier par la barre de navigation :
 * catalogue des programmes → Plan ; catalogue des séances ou des mouvements → Agenda ; autre onglet → dernier onglet utilisé du
 * calendrier (`null`). État de navigation en mémoire, jamais persisté.
 */
type CatalogueSegment = "movements" | "sessions" | "programs";

let catalogueSegment: CatalogueSegment = "sessions";
let previousTab: string | null = null;
let currentTab: string | null = null;

/** Segment affiché par le catalogue (appelé à chaque changement). */
export function noteCatalogueSegment(segment: CatalogueSegment): void {
  catalogueSegment = segment;
}

/** Onglet de la barre de navigation qui prend le focus (écouteur commun des onglets). */
export function noteTabFocus(tab: string): void {
  if (tab === currentTab) return;
  previousTab = currentTab;
  currentTab = tab;
}

/** Vue imposée à l'arrivée dans le calendrier ; `null` : dernier onglet utilisé. */
export function calendarArrivalView(): CalendarView | null {
  // L'écouteur commun et celui du calendrier ne sont pas ordonnés : l'onglet quitté est le précédent si le calendrier est déjà noté.
  const from = currentTab === "calendar" ? previousTab : currentTab;
  if (from !== "index") return null;
  return catalogueSegment === "programs" ? "plan" : "agenda";
}

/** Tests : état initial. */
export function resetCalendarArrival(): void {
  catalogueSegment = "sessions";
  previousTab = null;
  currentTab = null;
}
