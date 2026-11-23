import type { CalendarView } from "@/features/planning/CalendarViewTabs";

/**
 * D-562 (recette du 23/11/2026, constats b et c) — onglet ouvert en arrivant dans le calendrier par la barre de navigation :
 * catalogue des programmes → Plan ; catalogue des séances ou des mouvements → Agenda ; autre onglet → dernier onglet utilisé du
 * calendrier (`null`). État de navigation en mémoire, jamais persisté.
 *
 * Sens inverse (contre-recette du 23/11/2026, constats f et g — Hermann : « Aller de l'écran du Plan vers le catalogue doit amener
 * à l'écran des programmes » ; « aller de l'écran de l'agenda vers le catalogue doit amener à l'écran des séances ») : segment
 * ouvert en arrivant dans le catalogue par la barre de navigation depuis le calendrier. Journal (non cité) ou autre onglet :
 * dernier segment affiché (`null`).
 */
export type CatalogueSegment = "movements" | "sessions" | "programs";

let catalogueSegment: CatalogueSegment = "sessions";
let calendarView: CalendarView | null = null;
let previousTab: string | null = null;
let currentTab: string | null = null;

/** Segment affiché par le catalogue (appelé à chaque changement). */
export function noteCatalogueSegment(segment: CatalogueSegment): void {
  catalogueSegment = segment;
}

/** Vue affichée par le calendrier (appelé à chaque changement). */
export function noteCalendarView(view: CalendarView): void {
  calendarView = view;
}

/** Onglet de la barre de navigation qui prend le focus (écouteur commun des onglets). */
export function noteTabFocus(tab: string): void {
  if (tab === currentTab) return;
  previousTab = currentTab;
  currentTab = tab;
}

/** Onglet quitté pour `tab` : l'écouteur commun et celui de l'écran ne sont pas ordonnés (`tab` peut être déjà noté). */
function leftTabFor(tab: string): string | null {
  return currentTab === tab ? previousTab : currentTab;
}

/** Vue imposée à l'arrivée dans le calendrier ; `null` : dernier onglet utilisé. */
export function calendarArrivalView(): CalendarView | null {
  if (leftTabFor("calendar") !== "index") return null;
  return catalogueSegment === "programs" ? "plan" : "agenda";
}

/** Segment imposé à l'arrivée dans le catalogue ; `null` : dernier segment affiché. */
export function catalogueArrivalSegment(): CatalogueSegment | null {
  if (leftTabFor("index") !== "calendar") return null;
  if (calendarView === "plan") return "programs";
  if (calendarView === "agenda") return "sessions";
  return null;
}

/** Tests : état initial. */
export function resetCalendarArrival(): void {
  catalogueSegment = "sessions";
  calendarView = null;
  previousTab = null;
  currentTab = null;
}
