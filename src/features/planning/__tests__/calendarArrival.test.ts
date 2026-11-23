import { beforeEach, describe, expect, it } from "@jest/globals";

import { calendarArrivalView, noteCatalogueSegment, noteTabFocus, resetCalendarArrival } from "@/features/planning/calendarArrival";

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
