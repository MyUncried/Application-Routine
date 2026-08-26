import { describe, expect, it } from "@jest/globals";

import { strings } from "@/shared/i18n";

describe("strings", () => {
  it("exposes the four main tab labels in French", () => {
    expect(strings.nav).toEqual({
      sessions: "Mes séances",
      calendar: "Calendrier",
      history: "Suivi",
      profile: "Profil",
    });
  });

  it("exposes a title and a placeholder for each tab screen", () => {
    const tabScreens = [
      strings.screens.sessions,
      strings.screens.calendar,
      strings.screens.history,
      strings.screens.profile,
    ];

    for (const screen of tabScreens) {
      expect(screen.title.length).toBeGreaterThan(0);
      expect(screen.placeholder.length).toBeGreaterThan(0);
    }
  });

  it("exposes the not-found screen texts and accessibility labels", () => {
    expect(strings.screens.notFound.title.length).toBeGreaterThan(0);
    expect(strings.screens.notFound.backHome.length).toBeGreaterThan(0);
    expect(strings.screens.notFound.accessibility.title.length).toBeGreaterThan(0);
    expect(strings.screens.notFound.accessibility.backHome.length).toBeGreaterThan(0);
  });

  it("exposes the exact generic root error message", () => {
    expect(strings.errors.root.message).toBe(
      "Impossible d'afficher KODJO. Fermez puis relancez l'application.",
    );
  });
});
