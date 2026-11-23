import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  calendarArrivalView,
  catalogueArrivalSegment,
  noteCalendarView,
  noteCatalogueSegment,
  noteTabFocus,
  resetCalendarArrival,
} from "@/features/planning/calendarArrival";

/** D-562 (recette du 23/11/2026, constats b et c) : onglet ouvert en arrivant dans le calendrier. */
describe("arrivée dans le calendrier (D-562)", () => {
  beforeEach(() => resetCalendarArrival());

  it("catalogue des programmes → Plan ; des séances ou des mouvements → Agenda", () => {
    noteTabFocus("index");
    noteCatalogueSegment("programs");
    expect(calendarArrivalView()).toBe("plan");
    noteCatalogueSegment("sessions");
    expect(calendarArrivalView()).toBe("agenda");
    noteCatalogueSegment("movements");
    expect(calendarArrivalView()).toBe("agenda");
  });

  it("le calendrier déjà noté par l'écouteur commun : l'onglet quitté est le précédent", () => {
    noteTabFocus("index");
    noteCatalogueSegment("programs");
    noteTabFocus("calendar");
    expect(calendarArrivalView()).toBe("plan");
  });

  it("autre onglet → dernière vue utilisée (aucune vue imposée)", () => {
    noteCatalogueSegment("programs");
    noteTabFocus("index");
    noteTabFocus("history");
    expect(calendarArrivalView()).toBeNull();
    noteTabFocus("calendar");
    expect(calendarArrivalView()).toBeNull();
  });
});

/**
 * Contre-recette du 23/11/2026 (constats f et g — Hermann : « Aller de l'écran du Plan vers le catalogue doit amener à l'écran
 * des programmes » ; « aller de l'écran de l'agenda vers le catalogue doit amener à l'écran des séances. »).
 */
describe("arrivée dans le catalogue depuis le calendrier (sens inverse de D-562)", () => {
  beforeEach(() => resetCalendarArrival());

  it("Plan → Programmes ; Agenda → Séances ; Journal (non cité) → segment inchangé", () => {
    noteTabFocus("calendar");
    noteCalendarView("plan");
    expect(catalogueArrivalSegment()).toBe("programs");
    noteCalendarView("agenda");
    expect(catalogueArrivalSegment()).toBe("sessions");
    noteCalendarView("journal");
    expect(catalogueArrivalSegment()).toBeNull();
  });

  it("le catalogue déjà noté par l'écouteur commun : l'onglet quitté est le précédent", () => {
    noteTabFocus("calendar");
    noteCalendarView("plan");
    noteTabFocus("index");
    expect(catalogueArrivalSegment()).toBe("programs");
  });

  it("autre onglet, ou calendrier jamais ouvert → segment inchangé", () => {
    noteTabFocus("history");
    expect(catalogueArrivalSegment()).toBeNull();
    resetCalendarArrival();
    noteTabFocus("calendar");
    expect(catalogueArrivalSegment()).toBeNull();
    noteCalendarView("plan");
    noteTabFocus("history");
    noteTabFocus("index");
    expect(catalogueArrivalSegment()).toBeNull();
  });
});
