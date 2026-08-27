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

  it("exposes a title and a placeholder for each tab screen still awaiting its real UI", () => {
    const tabScreens = [strings.screens.calendar, strings.screens.history, strings.screens.profile];

    for (const screen of tabScreens) {
      expect(screen.title.length).toBeGreaterThan(0);
      expect(screen.placeholder.length).toBeGreaterThan(0);
    }
  });

  it("exposes the Catalogue screen title (T01-S06 — no placeholder, it has a real UI)", () => {
    expect(strings.screens.sessions.title.length).toBeGreaterThan(0);
  });

  it("exposes the Catalogue filter labels", () => {
    expect(strings.screens.sessions.filters).toEqual({
      all: "Toutes",
      scheduled: "Planifiées",
      archived: "Archivées",
    });
  });

  it("exposes the Catalogue create action label", () => {
    expect(strings.screens.sessions.createAction.length).toBeGreaterThan(0);
  });

  it("exposes the exact Catalogue loading accessibility label", () => {
    expect(strings.screens.sessions.loading.accessibilityLabel).toBe(
      "Chargement des séances en cours",
    );
  });

  it("exposes the exact Catalogue empty-state message", () => {
    expect(strings.screens.sessions.empty.message).toBe(
      "Vous verrez ici la liste de vos séances dès que vous aurez commencé à les créer.",
    );
  });

  it("exposes the exact Catalogue error message and retry label", () => {
    expect(strings.screens.sessions.error.message).toBe("Impossible de charger vos séances.");
    expect(strings.screens.sessions.error.retry).toBe("Réessayer");
  });

  it("exposes the Catalogue card singular/plural fragments and duration unit", () => {
    expect(strings.screens.sessions.card).toEqual({
      activitySingular: "activité",
      activityPlural: "activités",
      tourSingular: "tour",
      tourPlural: "tours",
      durationUnit: "min",
      expandAccessibilityLabel: "Déployer la séance",
      startAccessibilityLabel: "Démarrer la séance",
    });
  });

  it("exposes the Composition screen texts (T01-S07)", () => {
    expect(strings.screens.composition.title).toBe("Composition d’une séance");
    expect(strings.screens.composition.name).toBe("Nom de la séance");
    expect(strings.screens.composition.colorPicker).toEqual({
      label: "Couleur",
      paletteAccessibilityLabel: "Palette de couleurs",
      swatchAccessibilityLabel: "Couleur",
    });
    expect(strings.screens.composition.countdown.label).toBe("Compte à rebours initial");
    expect(strings.screens.composition.finalPhase.label).toBe("Fin de séance");
    expect(strings.screens.composition.tour.label).toBe("Tour");
    expect(strings.screens.composition.wheelPicker).toEqual({
      minutesAccessibilityLabel: "Minutes",
      secondsAccessibilityLabel: "Secondes",
    });
    expect(strings.screens.composition.addActivity).toBe("Ajouter une activité");
    expect(strings.screens.composition.continueAction).toBe("Continuer");
  });

  it("exposes the exact local Composition empty-summary label (V2 — singular, distinct from formatActivityCount(0))", () => {
    expect(strings.screens.composition.summary.empty).toBe("0 activité · 0 min");
  });

  it("exposes the exact abandon-creation modal texts (docs §06, « Les modales »)", () => {
    expect(strings.screens.composition.abandonModal).toEqual({
      title: "Abandonner la création ?",
      message: "Les informations saisies seront perdues et la séance ne sera pas créée.",
      continueCreating: "Continuer la création",
      abandon: "Abandonner",
    });
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
